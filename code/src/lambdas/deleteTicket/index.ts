import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { deleteItemFromPrimaryTable } from "../../dynamo/primaryTable/deleteItem";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { TicketType } from "../../models/requests/ticketType";
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { createBacklogTicketKey } from "../../keyGeneration/createBacklogTicketKey";
import { createAllBacklogTicketsKey } from "../../keyGeneration/createAllBacklogTicketsKey";

export const deleteTicket = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "ticketId",
        "ticketType"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const {
        boardId,
        companyId,
        ticketId,
        ticketType,
    } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
        ticketId: string;
        ticketType: TicketType;
    };

    const canDeleteTicketFromBoard = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canDeleteTicketFromBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to delete ticket from board"
        );
    }

    let itemId: string;
    let belongsTo: string;
    if (ticketType === TicketType.InProgress) {
        itemId = createInProgressTicketKey(companyId, boardId, ticketId);
        belongsTo = createAllInProgressTicketsKey(companyId, boardId);
    } else if (ticketType === TicketType.Backlog) {
        itemId = createBacklogTicketKey(companyId, boardId, ticketId);
        belongsTo = createAllBacklogTicketsKey(companyId, boardId);
    }

    const itemWasDeleted = await deleteItemFromPrimaryTable(itemId, belongsTo);
    if (itemWasDeleted === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error deleting the item from the board"
        );
    }

    return createSuccessResponse({});
};