import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";

export const deleteTicketTemplateForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const {
        companyId,
        boardId,
        ticketTemplateId,
    } = event.queryStringParameters;

    if (!companyId || !boardId || !ticketTemplateId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId, boardId, and ticket template id are required query parameters"
        );
    }

    const canDeleteTicketTemplate = await isBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canDeleteTicketTemplate) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board admin to create ticket templates"
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

    const newAttributes = await overrideSpecificAttributesInPrimaryTable(
        boardTicketTemplateKey,
        allBoardTicketTemplatesKey,
        {
            hasBeenDeleted: true,
        }
    );

    if (newAttributes === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error deleting the ticket template"
        );
    }

    return createSuccessResponse({});
};
