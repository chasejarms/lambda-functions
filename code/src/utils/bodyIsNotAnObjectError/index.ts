import { APIGatewayProxyEvent } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { createErrorResponse } from "../createErrorResponse";

export function bodyIsNotAnObjectError(event: APIGatewayProxyEvent) {
    try {
        JSON.parse(event.body);
    } catch {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Body must be an object"
        );
    }

    return false;
}
