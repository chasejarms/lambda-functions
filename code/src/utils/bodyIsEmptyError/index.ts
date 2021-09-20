import { APIGatewayProxyEvent } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../createErrorResponse";

export const bodyIsEmptyErrorMapping = {
    noBodyOnRequest: "There is no body on the request",
};
export function bodyIsEmptyError(event: APIGatewayProxyEvent) {
    if (!event.body) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            bodyIsEmptyErrorMapping.noBodyOnRequest
        );
    }

    return false;
}
