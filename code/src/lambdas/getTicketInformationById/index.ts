import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { getItemFromDirectAccessTicketIdIndex } from "../../dynamo/directAccessTicketIdIndex/getItem";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createDirectAccessTicketIdKey } from "../../keyGeneration/createDirectAccessTicketIdKey";
import { isBoardUser } from "../../utils/isBoardUser";

export const getTicketInformationById = async (
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

    if (!companyId || !boardId || !ticketId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId a required query parameters"
        );
    }

    const canGetTicketForBoard = await isBoardUser(event, boardId, companyId);
    if (!canGetTicketForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get this ticket information"
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
    if (ticket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the ticket"
        );
    }

    return createSuccessResponse(ticket);
};
