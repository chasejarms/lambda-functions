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
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const moveNonInProgressTicketToInProgress = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "ticketId",
        "columnId"
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
        columnId,
    } = event.queryStringParameters;

    const canMoveTicketToInProgress = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canMoveTicketToInProgress) {
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

            const inProgressTicketKey = createInProgressTicketKey(
                companyId,
                boardId,
                ticket.shortenedItemId
            );

            const allInProgressTicketsKey = createAllInProgressTicketsKey(
                companyId,
                boardId
            );

            const nowTimestamp = Date.now().toString();

            const updatedTicket: ITicket = {
                ...ticket,
                itemId: inProgressTicketKey,
                belongsTo: allInProgressTicketsKey,
                lastModifiedTimestamp: nowTimestamp,
                columnId,
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
