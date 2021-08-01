import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createBoardPriorityKey } from "../../keyGeneration/createBoardPriorityKey";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { IBoardPriorityList } from "../../models/database";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isBoardUser } from "../../utils/isBoardUser";

export const getPriorityListForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId a required query parameters"
        );
    }

    const canGetPriorityListForBoard = await isBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canGetPriorityListForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get the priority list for this board"
        );
    }

    const boardPriorityKey = createBoardPriorityKey(companyId, boardId);
    const priorityList = await getItemFromPrimaryTable<IBoardPriorityList>(
        boardPriorityKey,
        boardPriorityKey
    );

    if (priorityList === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the priority list for the board"
        );
    }

    return createSuccessResponse({
        item: priorityList,
    });
};
