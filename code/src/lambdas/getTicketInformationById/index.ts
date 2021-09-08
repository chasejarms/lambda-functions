import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { getItemFromDirectAccessTicketIdIndex } from "../../dynamo/directAccessTicketIdIndex/getItem";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createDirectAccessTicketIdKey } from "../../keyGeneration/createDirectAccessTicketIdKey";
import { isCompanyUser } from "../../utils/isCompanyUser";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";

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

    const canGetTicketForBoard = await isCompanyUser(event, companyId);
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

    const boardTicketTemplateKey = createBoardTicketTemplateKey(
        companyId,
        boardId,
        ticket.ticketTemplateShortenedItemId
    );
    const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
        companyId,
        boardId
    );
    const ticketTemplate = await getItemFromPrimaryTable<ITicketTemplate>(
        boardTicketTemplateKey,
        allBoardTicketTemplatesKey
    );

    if (ticketTemplate === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Failed to retrieve the ticket template for the ticket"
        );
    }

    return createSuccessResponse({
        ticket,
        ticketTemplate,
    });
};
