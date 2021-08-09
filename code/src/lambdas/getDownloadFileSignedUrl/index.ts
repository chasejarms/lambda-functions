import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isBoardUser } from "../../utils/isBoardUser";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createTicketSourceFileS3StorageKey } from "../../keyGeneration/createTicketSourceFileS3StorageKey";

export const getDownloadFileSignedUrl = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "ticketId",
        "fileName"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }
    const {
        boardId,
        companyId,
        ticketId,
        fileName,
    } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
        ticketId: string;
        fileName: string;
    };
    const canDownloadFile = await isBoardUser(event, boardId, companyId);
    if (!canDownloadFile) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to download this file"
        );
    }

    const key = createTicketSourceFileS3StorageKey(
        companyId,
        boardId,
        ticketId,
        fileName
    );

    const client = new S3Client({});
    const command = new GetObjectCommand({
        Bucket: "elastic-project-management-company-source-files",
        Key: key,
    });

    try {
        const signedUrlResponse = getSignedUrl(client, command, {
            expiresIn: 300,
        });
        return createSuccessResponse(signedUrlResponse);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error getting the signed url"
        );
    }
};
