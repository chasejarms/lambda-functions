import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyUser } from "../../utils/isCompanyUser";

export const getInProgressTicketsForBoard = async (
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

    const canGetInProgressTicketsForBoard = await isCompanyUser(
        event,
        companyId
    );
    if (!canGetInProgressTicketsForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get the in progress tickets for this board"
        );
    }

    const allInProgressTicketsKey = createAllInProgressTicketsKey(
        companyId,
        boardId
    );

    const tickets = await queryParentToChildIndexBeginsWith<ITicket>(
        "C",
        allInProgressTicketsKey
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
