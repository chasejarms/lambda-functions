import { HttpStatusCode } from "../../models/httpStatusCode";

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
