import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { isCompanyUserAdminOrBoardAdmin } from "../../utils/isCompanyUserAdminOrBoardAdmin";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { ticketTemplateCreateRequestErrorMessage } from "../../dataValidation/ticketTemplateCreateRequestErrorMessage";
import { ITicketTemplatePutRequest } from "../../models/requests/ticketTemplatePutRequest";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";

export const updateTicketTemplateForBoard = async (
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
        "companyId",
        "boardId",
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

    const { ticketTemplate } = JSON.parse(event.body) as {
        ticketTemplate: ITicketTemplatePutRequest;
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

    const canUpdateTicketTemplateForBoard = await isCompanyUserAdminOrBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canUpdateTicketTemplateForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board admin to create ticket templates"
        );
    }

    const boardTicketTemplateKey = createBoardTicketTemplateKey(
        companyId,
        boardId,
        ticketTemplateId
    );
    const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
        companyId,
        boardId
    );

    const updatedTicketTemplate = await overrideSpecificAttributesInPrimaryTable<
        ITicketTemplate
    >(boardTicketTemplateKey, allBoardTicketTemplatesKey, ticketTemplate);

    if (updatedTicketTemplate === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the ticket template"
        );
    }

    return createSuccessResponse({});
};
