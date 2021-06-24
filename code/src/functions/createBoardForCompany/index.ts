import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { isCompanyUserAdmin } from "../../utils/isCompanyUserAdmin";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";

export const createBoardForCompany = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const bodyIsEmptyErrorResponse = bodyIsEmptyError(event);
    if (bodyIsEmptyErrorResponse) {
        return bodyIsEmptyErrorResponse;
    }

    const bodyIsNotAnObjectErrorResponse = bodyIsNotAnObjectError(event);
    if (bodyIsNotAnObjectErrorResponse) {
        return bodyIsNotAnObjectErrorResponse;
    }

    const { companyId, boardName, boardDescription } = JSON.parse(
        event.body
    ) as {
        companyId: string;
        boardName: string;
        boardDescription: string;
    };

    if (!companyId || !boardName || !boardDescription) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId, boardName, and boardDescription are required fields."
        );
    }

    const canCreateBoard = await isCompanyUserAdmin(event, companyId);
    if (!canCreateBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to create board"
        );
    }

    // create board and return it

    return {
        statusCode: HttpStatusCode.Ok,
        body: "",
    };
};
