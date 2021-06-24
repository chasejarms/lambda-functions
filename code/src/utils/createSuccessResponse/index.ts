import { HttpStatusCode } from "../../models/httpStatusCode";

export function createSuccessResponse(body: any) {
    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify(body),
    };
}
