import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicketUpdateRequest } from "../../models/requests/ticketUpdateRequest";
import * as Joi from "joi";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { validateTicketTitleAndSummary } from "../../utils/validateTicketTitleAndSummary";
import { ticketSectionsError } from "../../utils/ticketSectionsError";
import { isCompanyUser } from "../../utils/isCompanyUser";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";

export const updateTicketForBoard = async (
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
        "itemId",
        "belongsTo"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { itemId, belongsTo } = event.queryStringParameters;

    const [companyPortion, boardPortion] = itemId.split("_");
    const companyId = companyPortion.replace("COMPANY.", "");
    const boardId = boardPortion.replace("BOARD.", "");

    const canUpdateTicketForBoard = await isCompanyUser(event, companyId);
    if (!canUpdateTicketForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the ticket for the board"
        );
    }

    const parsedBody = JSON.parse(event.body) as ITicketUpdateRequest;

    const requestSchema = Joi.object({
        title: Joi.string().required(),
        summary: Joi.string().allow(""),
        sections: Joi.array(),
    });

    const originalTicket = await getItemFromPrimaryTable<ITicket>(
        itemId,
        belongsTo
    );
    if (originalTicket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error getting the original ticket"
        );
    }

    const boardTicketTemplateKey = createBoardTicketTemplateKey(
        companyId,
        boardId,
        originalTicket.ticketTemplateShortenedItemId
    );
    const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
        companyId,
        boardId
    );
    const originalTicketTemplate = await getItemFromPrimaryTable<ITicket>(
        boardTicketTemplateKey,
        allBoardTicketTemplatesKey
    );

    if (originalTicketTemplate === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error retrieving the original ticket template"
        );
    }

    const ticketErrorMessage = validateTicketTitleAndSummary(
        parsedBody.title,
        parsedBody.summary
    );
    if (ticketErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            ticketErrorMessage
        );
    }

    const { error } = requestSchema.validate(parsedBody);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const errorFromTicketSections = ticketSectionsError(
        parsedBody.sections,
        originalTicketTemplate.sections
    );
    if (errorFromTicketSections) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            errorFromTicketSections
        );
    }

    const updatedTicket = await overrideSpecificAttributesInPrimaryTable<
        ITicket
    >(itemId, belongsTo, {
        summary: parsedBody.summary,
        title: parsedBody.title,
        sections: parsedBody.sections,
    });

    if (updatedTicket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the ticket column"
        );
    }

    return createSuccessResponse(updatedTicket);
};
