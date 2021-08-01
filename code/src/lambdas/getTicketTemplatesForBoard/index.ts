import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { createStartOfTicketTemplateKey } from "../../keyGeneration/createStartOfTicketTemplateKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { isBoardUser } from "../../utils/isBoardUser";

export const getTicketTemplatesForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameter"
        );
    }

    const canGetTicketTemplatesForBoard = await isBoardUser(
        event,
        boardId,
        companyId
    );

    if (!canGetTicketTemplatesForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board user to get ticket templates for board"
        );
    }

    const startOfTicketTemplateKey = createStartOfTicketTemplateKey(
        companyId,
        boardId
    );
    const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
        companyId,
        boardId
    );
    const ticketTemplates = await queryParentToChildIndexBeginsWith<
        ITicketTemplate
    >(startOfTicketTemplateKey, allBoardTicketTemplatesKey);

    if (ticketTemplates === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the ticket templates from dynamo"
        );
    }

    return createSuccessResponse({
        items: ticketTemplates,
    });
};
