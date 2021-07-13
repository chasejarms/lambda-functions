import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicket } from "../../models/database/ticket";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import * as Joi from "joi";

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
        "boardId",
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId, boardId } = event.queryStringParameters;

    const { ticket } = JSON.parse(event.body) as {
        ticket: ITicket;
    };

    if (!ticket) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "the ticket must be part of the request body"
        );
    }

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

    // validate the structure of the object

    const requestSchema = Joi.object({
        shortenedItemId: Joi.string().required(),
        title: Joi.string().required(),
        summary: Joi.string().allow(""),
        sections: Joi.array(),
        createdTimestamp: Joi.string().allow(""),
        lastModifiedTimestamp: Joi.string().allow(""),
        completedTimestamp: Joi.string().allow(""),
        tags: Joi.array().items(
            Joi.object({
                name: Joi.string(),
                color: Joi.string(),
            })
        ),
        simplifiedTicketTemplate: Joi.object({
            title: Joi.object({
                label: Joi.string().required(),
            }).required(),
            summary: Joi.object({
                isRequired: Joi.boolean().required(),
                label: Joi.string().required(),
            }),
            sections: Joi.array(),
        }).required(),
        columnId: Joi.string().allow(""),
    });

    const { error } = requestSchema.validate(ticket);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    // run an update but don't allow changing of certain values

    const boardPriorityKey = createBoardPriorityKey(companyId, boardId);
    const wasSuccessful = await updateItemInPrimaryTable(
        boardPriorityKey,
        boardPriorityKey,
        {
            priorities,
        }
    );

    if (wasSuccessful === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the priority list for the board"
        );
    }

    return createSuccessResponse({});
};
