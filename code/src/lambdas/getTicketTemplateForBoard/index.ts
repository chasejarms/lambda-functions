import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { isBoardUser } from "../../utils/isBoardUser";

export const getTicketTemplateForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "ticketTemplateId"
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
        ticketTemplateId,
    } = event.queryStringParameters;

    const canGetTicketTemplateForBoard = await isBoardUser(
        event,
        boardId,
        companyId
    );

    if (!canGetTicketTemplateForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board user to get this ticket template"
        );
    }

    const boardTicketTemplateKey = createBoardTicketTemplateKey(
        companyId,
        boardId,
        ticketTemplateId,
        0
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
            "Error getting the ticket template from dynamo"
        );
    }

    return createSuccessResponse(ticketTemplate);
};
