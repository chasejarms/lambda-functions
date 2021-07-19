import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicketUpdateRequest } from "../../models/requests/ticketUpdateRequest";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import * as Joi from "joi";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

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

    const canUpdateTicketForBoard = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
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
        tags: Joi.array().items(
            Joi.object({
                name: Joi.string(),
                color: Joi.string(),
            })
        ),
    });

    const { error } = requestSchema.validate(parsedBody);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const updatedTicket = await overrideSpecificAttributesInPrimaryTable<
        ITicket
    >(itemId, belongsTo, {
        tags: parsedBody.tags,
        summary: parsedBody.summary,
        title: parsedBody.title,
    });

    if (updatedTicket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the ticket column"
        );
    }

    return createSuccessResponse(updatedTicket);
};
