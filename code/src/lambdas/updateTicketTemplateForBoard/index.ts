import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import * as Joi from "joi";
import { ITicketTemplatePutRequest } from "../../models/requests/ticketTemplatePutRequest";

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

    const request = JSON.parse(event.body) as ITicketTemplatePutRequest;

    const requestBodySchema = Joi.object({
        priorityWeightingCalculation: Joi.string().allow(""),
    });
    const { error } = requestBodySchema.validate(request);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const canUpdateTicketTemplateForBoard = await isBoardAdmin(
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
    >(boardTicketTemplateKey, allBoardTicketTemplatesKey, {
        priorityWeightingCalculation: request.priorityWeightingCalculation,
    });

    if (updatedTicketTemplate === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the ticket template"
        );
    }

    return createSuccessResponse({});
};
