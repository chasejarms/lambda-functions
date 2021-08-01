import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBacklogTicketsKey } from "../../keyGeneration/createAllBacklogTicketsKey";
import { isBoardUser } from "../../utils/isBoardUser";

export const getBacklogTicketsForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId, boardId } = event.queryStringParameters;

    const canGetBacklogTicketsForBoard = await isBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canGetBacklogTicketsForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get the backlog tickets for this board"
        );
    }

    const allBacklogTicketsKey = createAllBacklogTicketsKey(companyId, boardId);

    const tickets = await queryParentToChildIndexBeginsWith<ITicket>(
        "C",
        allBacklogTicketsKey
    );

    if (tickets === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the tickets for the board"
        );
    }

    return createSuccessResponse({
        tickets,
    });
};
