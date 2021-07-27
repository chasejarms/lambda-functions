import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { createDirectAccessTicketIdKey } from "../../keyGeneration/createDirectAccessTicketIdKey";
import { getItemFromDirectAccessTicketIdIndex } from "../../dynamo/directAccessTicketIdIndex/getItem";
import { ITicket } from "../../models/database/ticket";
import { tryTransactWriteThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import {
    ITransactWriteItemDeleteParameter,
    TransactWriteItemType,
    ITransactWriteItemPutParameter,
} from "../../dynamo/primaryTable/transactWrite";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBacklogTicketsKey } from "../../keyGeneration/createAllBacklogTicketsKey";
import { createBacklogTicketKey } from "../../keyGeneration/createBacklogTicketKey";

export const moveNonBacklogTicketToBacklog = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "ticketId"
    );

    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId, boardId, ticketId } = event.queryStringParameters;

    const canMoveTicketToBacklog = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canMoveTicketToBacklog) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to move this ticket to in progress"
        );
    }

    const directAccessTicketIdKey = createDirectAccessTicketIdKey(
        companyId,
        boardId,
        ticketId
    );
    const ticket = await getItemFromDirectAccessTicketIdIndex<ITicket>(
        directAccessTicketIdKey
    );

    const transactionWasSuccessful = await tryTransactWriteThreeTimesInPrimaryTable(
        () => {
            const deleteTicketTransaction: ITransactWriteItemDeleteParameter = {
                type: TransactWriteItemType.Delete,
                itemId: ticket.itemId,
                belongsTo: ticket.belongsTo,
            };

            const backlogTicketKey = createBacklogTicketKey(
                companyId,
                boardId,
                ticket.shortenedItemId
            );

            const allBacklogTicketsKey = createAllBacklogTicketsKey(
                companyId,
                boardId
            );

            const nowTimestamp = Date.now().toString();

            const updatedTicket: ITicket = {
                ...ticket,
                itemId: backlogTicketKey,
                belongsTo: allBacklogTicketsKey,
                completedTimestamp: "",
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
