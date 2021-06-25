import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export function createErrorResponse(
    statusCode: number | HttpStatusCode,
    message: string
) {
    console.log(message);
    return {
        statusCode,
        body: JSON.stringify({
            message,
        }),
    };
}
