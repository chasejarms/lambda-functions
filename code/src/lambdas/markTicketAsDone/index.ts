import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { tryTransactWriteThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import { TicketType } from "../../models/requests/ticketType";
import { createBacklogTicketKey } from "../../keyGeneration/createBacklogTicketKey";
import { createAllBacklogTicketsKey } from "../../keyGeneration/createAllBacklogTicketsKey";
import {
    ITransactWriteItemDeleteParameter,
    TransactWriteItemType,
    ITransactWriteItemPutParameter,
} from "../../dynamo/primaryTable/transactWrite";
import { createDoneTicketKey } from "../../keyGeneration/createDoneTicketKey";
import { createAllDoneTicketsKey } from "../../keyGeneration/createAllDoneTicketsKey";

export const updateColumnOnTicket = async (
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
        companyId,
        boardId,
        ticketId,
        ticketType,
    } = event.queryStringParameters;

    const canMarkTicketAsDone = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canMarkTicketAsDone) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to mark this ticket as done"
        );
    }

    const originalTicketItemId =
        ticketType === TicketType.InProgress
            ? createInProgressTicketKey(companyId, boardId, ticketId)
            : createBacklogTicketKey(companyId, boardId, ticketId);

    const originalTicketBelongsTo =
        ticketType === TicketType.Backlog
            ? createAllInProgressTicketsKey(companyId, boardId)
            : createAllBacklogTicketsKey(companyId, boardId);

    const ticket = await getItemFromPrimaryTable<ITicket>(
        originalTicketItemId,
        originalTicketBelongsTo
    );

    const transactionWasSuccessful = await tryTransactWriteThreeTimesInPrimaryTable(
        () => {
            const deleteTicketTransaction: ITransactWriteItemDeleteParameter = {
                type: TransactWriteItemType.Delete,
                itemId: originalTicketItemId,
                belongsTo: originalTicketBelongsTo,
            };

            const nowTimestamp = Date.now().toString();

            const doneTicketKey = createDoneTicketKey(
                companyId,
                boardId,
                ticket.shortenedItemId,
                nowTimestamp
            );
            const allDoneTicketsKey = createAllDoneTicketsKey(
                companyId,
                boardId
            );
            const updatedTicket: ITicket = {
                ...ticket,
                belongsTo: allDoneTicketsKey,
                itemId: doneTicketKey,
                completedTimestamp: nowTimestamp,
                lastModifiedTimestamp: nowTimestamp,
            };

            const createTicketTransaction: ITransactWriteItemPutParameter = {
                type: TransactWriteItemType.Put,
                item: updatedTicket,
                canOverrideExistingItem: false,
            };

            return [deleteTicketTransaction, createTicketTransaction];
        }
    );

    if (transactionWasSuccessful === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error deleting the orignal ticket or creating the done ticket"
        );
    }

    return createSuccessResponse({});
};
