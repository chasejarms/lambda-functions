import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isBoardUser } from "../../utils/isBoardUser";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { createAllFilesForTicketKey } from "../../keyGeneration/createAllFilesForTicketKey";
import { IFileForTicket } from "../../models/database/fileForTicket";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const getTicketFilesWithSignedUrls = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "ticketId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }
    const { boardId, companyId, ticketId } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
        ticketId: string;
    };
    const canGetTicketFileSignedUrls = await isBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canGetTicketFileSignedUrls) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to get the signed urls for this ticket"
        );
    }

    const allFilesForTicketKey = createAllFilesForTicketKey(
        companyId,
        boardId,
        ticketId
    );
    const filesForTicket = await queryParentToChildIndexBeginsWith<
        IFileForTicket
    >("C", allFilesForTicketKey);

    if (filesForTicket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error getting the files for the ticket from dynamo"
        );
    }

    const client = new S3Client({});
    const signedUrlPromises = filesForTicket.map((file) => {
        const command = new GetObjectCommand({
            Bucket: "elastic-project-management-company-source-files",
            Key: file.srcUrl,
        });
        return getSignedUrl(client, command, { expiresIn: 300 });
    });

    try {
        const signedUrls = await Promise.all(signedUrlPromises);
        const response = filesForTicket.map((file, index) => {
            return {
                ...file,
                signedGetUrl: signedUrls[index],
            };
        });
        return createSuccessResponse(response);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the signed urls"
        );
    }
};
