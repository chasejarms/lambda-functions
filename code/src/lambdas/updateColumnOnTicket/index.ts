import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicket } from "../../models/database/ticket";
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyUser } from "../../utils/isCompanyUser";

export const updateColumnOnTicket = async (
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

    const { companyId, boardId, ticketId } = event.queryStringParameters;

    const { columnId } = JSON.parse(event.body) as {
        columnId: string;
    };

    if (!columnId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "the ticket needs a column id as part of the request body"
        );
    }

    const canUpdateTicketForBoard = await isCompanyUser(event, companyId);
    if (!canUpdateTicketForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the ticket for the board"
        );
    }

    const inProgressTicketKey = createInProgressTicketKey(
        companyId,
        boardId,
        ticketId
    );
    const allInProgressTicketsKey = createAllInProgressTicketsKey(
        companyId,
        boardId
    );

    const updatedTicket = await overrideSpecificAttributesInPrimaryTable<
        ITicket
    >(inProgressTicketKey, allInProgressTicketsKey, {
        columnId,
    });

    if (updatedTicket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the ticket column"
        );
    }

    return createSuccessResponse({});
};
