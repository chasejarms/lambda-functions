import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isBoardUser } from "../../utils/isBoardUser";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import * as AWS from "aws-sdk";
import { S3 } from "aws-sdk";
import { createTicketSourceFileS3StorageFolderKey } from "../../keyGeneration/createTicketSourceFileS3StorageFolderKey";

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

    const s3 = new AWS.S3();
    const prefix = createTicketSourceFileS3StorageFolderKey(
        companyId,
        boardId,
        ticketId
    );
    const listObjectsRequest: S3.Types.ListObjectsV2Request = {
        Bucket: "elastic-project-management-company-source-files",
        Prefix: prefix,
    };
    let s3Objects: S3.ObjectList;
    try {
        const s3ListObjectsResponse = await s3
            .listObjectsV2(listObjectsRequest)
            .promise();
        s3Objects = s3ListObjectsResponse.Contents;
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            `There was an issue listing the s3 objects in folder ${prefix}`
        );
    }

    if (s3Objects === undefined) {
        return createSuccessResponse([]);
    }

    const client = new S3Client({});
    const signedUrlPromises = s3Objects.map((file) => {
        const command = new GetObjectCommand({
            Bucket: "elastic-project-management-company-source-files",
            Key: file.Key,
        });
        return getSignedUrl(client, command, { expiresIn: 300 });
    });

    try {
        const signedUrls = await Promise.all(signedUrlPromises);
        const response = s3Objects.map((s3Object, index) => {
            const fileName = s3Object.Key.replace(prefix, "");
            return {
                size: s3Object.Size,
                fileName,
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
