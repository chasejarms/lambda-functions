import { APIGatewayProxyEvent } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { createErrorResponse } from "../createErrorResponse";

export function bodyIsEmptyError(event: APIGatewayProxyEvent) {
    if (!event.body) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "No Body On Request"
        );
    }

    return false;
}
