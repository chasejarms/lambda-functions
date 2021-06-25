import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export function createSuccessResponse(body: any) {
    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify(body),
    };
}
