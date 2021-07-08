import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicketCreateRequest } from "../../models/requests/ticketCreateRequest";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import * as Joi from "joi";

export const createTicketForBoard = async (
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

    const { ticket } = JSON.parse(event.body) as {
        ticket: ITicketCreateRequest;
    };

    // stop here while you learn about how the joi library works
    Joi.object({
        title: Joi.string().required().min(1),
        summary: Joi.string().required(),
        fields: Joi.object({}).required(),
        tags: Joi.array().items(Joi.string()),
        simplifiedTicketTemplate: Joi.object({
            title: Joi.object({
                label: Joi.string().required(),
            }),
            summary: Joi.object({
                isRequired: Joi.boolean().required(),
            }),
        }),
    });

    if (!ticket) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "ticket is a required field on the request"
        );
    }

    if (!ticket.title) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "the title is a required"
        );
    }

    const canCreateTag = await isCompanyUserAdminOrBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canCreateTag) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to create tag"
        );
    }

    const tagKey = createTagKey(companyId, boardId, tagName);
    const allTagsKey = createAllTagsKey(companyId, boardId);

    const databaseItemAfterCreate = await createNewItemInPrimaryTable({
        itemId: tagKey,
        belongsTo: allTagsKey,
        color: tagColor,
        name: tagName,
    });

    if (!databaseItemAfterCreate) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "A tag with the same name already exists"
        );
    }

    return createSuccessResponse({
        tagInformation: databaseItemAfterCreate,
    });
};
