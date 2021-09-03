import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from "@aws-sdk/client-s3";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import * as Joi from "joi";
import { createTicketSourceFileS3StorageKey } from "../../keyGeneration/createTicketSourceFileS3StorageKey";
import { isCompanyUser } from "../../utils/isCompanyUser";

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
    const canUploadImagesForBoard = await isCompanyUser(event, companyId);
    if (!canUploadImagesForBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to create the ticket"
        );
    }

    const fiveMegabytes = 5000000;
    const requestSchema = Joi.object({
        files: Joi.array().items(
            Joi.object({
                name: Joi.string()
                    .required()
                    .pattern(/\s/, { name: "spaces", invert: true }),
                size: Joi.number().required().min(0).max(fiveMegabytes),
                contentType: Joi.string()
                    .required()
                    .valid(
                        "image/gif",
                        "image/jpeg",
                        "image/png",
                        "image/tiff",
                        "image/vnd.microsoft.icon",
                        "image/x-icon",
                        "image/vnd.djvu",
                        "image/svg+xml"
                    ),
            })
        ),
    });
    const body = JSON.parse(event.body) as {
        files: {
            name: string;
            size: number;
            contentType: string;
        }[];
    };

    const { error } = requestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const client = new S3Client({});
    const signedUrlPromises: Promise<string>[] = [];
    body.files.forEach((file) => {
        const Key = createTicketSourceFileS3StorageKey(
            companyId,
            boardId,
            ticketId,
            file.name
        );
        const putCommand = new PutObjectCommand({
            Bucket: "elastic-project-management-company-source-files",
            Key,
            ContentLength: file.size,
            ContentType: file.contentType,
        });
        const putPromise = getSignedUrl(client, putCommand, { expiresIn: 300 });
        signedUrlPromises.push(putPromise);

        const getCommand = new GetObjectCommand({
            Bucket: "elastic-project-management-company-source-files",
            Key,
        });
        const getPromise = getSignedUrl(client, getCommand, { expiresIn: 300 });
        signedUrlPromises.push(getPromise);
    });

    try {
        const signedUrls = await Promise.all(signedUrlPromises);

        const response = body.files.reduce<{
            [fileName: string]: {
                fileName: string;
                putSignedUrl: string;
                getSignedUrl: string;
            };
        }>((mapping, file, currentIndex) => {
            const fileName = file.name;
            const putSignedUrl = signedUrls[currentIndex * 2];
            const getSignedUrl = signedUrls[currentIndex * 2 + 1];
            mapping[fileName] = {
                fileName,
                putSignedUrl,
                getSignedUrl,
            };

            return mapping;
        }, {});

        return createSuccessResponse(response);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the signed urls"
        );
    }
};
