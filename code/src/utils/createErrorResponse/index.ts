import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export interface ICreateErrorResponse {
    statusCode: HttpStatusCode;
    body: string;
    headers: {
        "Access-Control-Allow-Headers": "*";
        "Access-Control-Allow-Origin": "*";
        "Access-Control-Allow-Methods": "*";
        "Access-Control-Allow-Credentials": true;
    };
}

export function createErrorResponse(
    statusCode: number | HttpStatusCode,
    message: string
): ICreateErrorResponse {
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
