import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { isBoardUser } from "../../utils/isBoardUser";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import * as Joi from "joi";
import { createTicketSourceFileS3StorageKey } from "../../keyGeneration/createTicketSourceFileS3StorageKey";
import * as AWS from "aws-sdk";
import { S3 } from "aws-sdk";

export const deleteTicketFile = async (
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
    const canDeleteTicketImage = await isBoardUser(event, boardId, companyId);
    if (!canDeleteTicketImage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to delete this ticket image"
        );
    }

    const requestSchema = Joi.object({
        fileName: Joi.string()
            .required()
            .pattern(/\s/, { name: "spaces", invert: true }),
    });
    const body = JSON.parse(event.body) as {
        fileName: string;
    };

    const { error } = requestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const s3 = new AWS.S3();
    const Key = createTicketSourceFileS3StorageKey(
        companyId,
        boardId,
        ticketId,
        body.fileName
    );
    const object: S3.Types.DeleteObjectRequest = {
        Bucket: "elastic-project-management-company-source-files",
        Key,
    };
    try {
        await s3.deleteObject(object).promise();
        return createSuccessResponse({});
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error deleting the object from S3"
        );
    }
};
