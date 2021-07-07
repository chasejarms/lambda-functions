import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { isCompanyUserAdminOrBoardAdmin } from "../../utils/isCompanyUserAdminOrBoardAdmin";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { tryCreateNewItemThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryCreateNewItemThreeTimes";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { ticketTemplateCreateRequestErrorMessage } from "../../dataValidation/ticketTemplateCreateRequestErrorMessage";
import { ITicketTemplateCreateRequest } from "../../models/requests/ticketTemplateCreateRequest";

export const createTicketTemplateForBoard = async (
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

    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameter"
        );
    }

    const { ticketTemplate } = JSON.parse(event.body) as {
        ticketTemplate: ITicketTemplateCreateRequest;
    };
    if (!ticketTemplate) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "ticketTemplate is a required field"
        );
    }

    const errorMessageForTicketTemplate = ticketTemplateCreateRequestErrorMessage(
        ticketTemplate
    );
    if (errorMessageForTicketTemplate) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            errorMessageForTicketTemplate
        );
    }

    const canCreateTicketTemplateForBoard = await isCompanyUserAdminOrBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canCreateTicketTemplateForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board admin to create ticket templates"
        );
    }

    const createdTicketTemplate = await tryCreateNewItemThreeTimesInPrimaryTable(
        () => {
            const boardTicketTemplateId = generateUniqueId(1);
            const boardTicketTemplateKey = createBoardTicketTemplateKey(
                companyId,
                boardId,
                boardTicketTemplateId
            );
            const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
                companyId,
                boardId
            );
            const ticketTemplateDatabaseItem: ITicketTemplate = {
                itemId: boardTicketTemplateKey,
                belongsTo: allBoardTicketTemplatesKey,
                shortenedItemId: boardTicketTemplateId,
                ...ticketTemplate,
            };

            return ticketTemplateDatabaseItem;
        }
    );

    if (createdTicketTemplate === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error creating the ticket template"
        );
    }

    return createSuccessResponse({
        ticketTemplate: createdTicketTemplate,
    });
};
