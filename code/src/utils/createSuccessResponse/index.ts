import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export function createSuccessResponse(body: any) {
    return {
        statusCode: HttpStatusCode.Ok,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(body),
    };
}
