import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { isArray } from "lodash";
import { isCompanyUserAdminOrBoardAdmin } from "../../utils/isCompanyUserAdminOrBoardAdmin";
import { createBoardPriorityKey } from "../../keyGeneration/createBoardPriorityKey";
import { updateItemInPrimaryTable } from "../../dynamo/primaryTable/updateItem";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const updatePriorityListForBoard = async (
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

    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId a required query parameters"
        );
    }

    const { priorities } = JSON.parse(event.body) as {
        priorities: string[];
    };

    if (!priorities || !isArray(priorities)) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "priorities must be an array and must be part of the request body"
        );
    }

    const canUpdatePriorityListForBoard = await isCompanyUserAdminOrBoardAdmin(
        event,
        boardId,
        companyId
    );
    if (!canUpdatePriorityListForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the priority list for the board"
        );
    }

    const boardPriorityKey = createBoardPriorityKey(companyId, boardId);
    const wasSuccessful = await updateItemInPrimaryTable(
        boardPriorityKey,
        boardPriorityKey,
        {
            priorities,
        }
    );

    if (wasSuccessful === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the priority list for the board"
        );
    }

    return createSuccessResponse({});
};
