import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export function createErrorResponse(
    statusCode: number | HttpStatusCode,
    message: string
) {
    console.log(message);
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
            message,
        }),
    };
}
