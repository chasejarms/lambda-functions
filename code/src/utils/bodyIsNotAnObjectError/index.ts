import { APIGatewayProxyEvent } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../createErrorResponse";

export const bodyIsNotAnObjectErrorMapping = {
    mustBeAnObject: "Body must be an object",
};

export function bodyIsNotAnObjectError(event: APIGatewayProxyEvent) {
    try {
        JSON.parse(event.body);
    } catch {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            bodyIsNotAnObjectErrorMapping.mustBeAnObject
        );
    }

    return false;
}
