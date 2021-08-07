import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { isBoardUser } from "../../utils/isBoardUser";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import * as Joi from "joi";
import { createTicketSourceFileS3StorageKey } from "../../keyGeneration/createTicketSourceFileS3StorageKey";

export const createUploadTicketImageSignedUrls = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const bodyIsEmptyErrorResponse = bodyIsEmptyError(event);
    if (bodyIsEmptyErrorResponse) {
        return bodyIsEmptyErrorResponse;
    }
    const bodyIsNotAnObjectErrorResponse = bodyIsNotAnObjectError(event);
    if (bodyIsNotAnObjectErrorResponse) {
        return bodyIsNotAnObjectErrorResponse;
    }
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
    const canUploadImagesForBoard = await isBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canUploadImagesForBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to create the ticket"
        );
    }

    const requestSchema = Joi.object({
        files: Joi.array().items(
            Joi.object({
                name: Joi.string()
                    .required()
                    .pattern(/\s/, { name: "spaces", invert: true }),
            })
        ),
    });
    const body = JSON.parse(event.body) as {
        files: {
            name: string;
        }[];
    };

    const { error } = requestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const client = new S3Client({});
    const signedUrlPromises = body.files.map((file) => {
        const Key = createTicketSourceFileS3StorageKey(
            companyId,
            boardId,
            ticketId,
            file.name
        );
        const command = new PutObjectCommand({
            Bucket: "elastic-project-management-company-source-files",
            Key,
        });
        return getSignedUrl(client, command, { expiresIn: 300 });
    });

    try {
        const signedUrls = await Promise.all(signedUrlPromises);
        return createSuccessResponse(signedUrls);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the signed urls"
        );
    }
};
