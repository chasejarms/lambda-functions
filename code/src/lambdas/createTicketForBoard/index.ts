import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicketCreateRequest } from "../../models/requests/ticketCreateRequest";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import * as Joi from "joi";
import { tryCreateNewItemThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryCreateNewItemThreeTimes";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { createBacklogTicketKey } from "../../keyGeneration/createBacklogTicketKey";
import { createAllBacklogTicketsKey } from "../../keyGeneration/createAllBacklogTicketsKey";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createDirectAccessTicketIdKey } from "../../keyGeneration/createDirectAccessTicketIdKey";
import { getItemFromDirectAccessTicketIdIndex } from "../../dynamo/directAccessTicketIdIndex/getItem";
import { validateTicketTitleAndSummary } from "../../utils/validateTicketTitleAndSummary";
import { ticketSectionsError } from "../../utils/ticketSectionsError";
import { isCompanyUser } from "../../utils/isCompanyUser";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";

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

    const { boardId, companyId } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
    };

    const canCreateTicketForBoard = await isCompanyUser(event, companyId);

    if (!canCreateTicketForBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to create the ticket"
        );
    }

    const { ticket } = JSON.parse(event.body) as {
        ticket: ITicketCreateRequest;
    };

    const requestSchema = Joi.object({
        title: Joi.string().required(),
        summary: Joi.string().allow(""),
        sections: Joi.array(),
        ticketTemplateShortenedItemId: Joi.string().required(),
        startingColumnId: Joi.string().allow(""),
    });

    const { error } = requestSchema.validate(ticket);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const boardTicketTemplateKey = createBoardTicketTemplateKey(
        companyId,
        boardId,
        ticket.ticketTemplateShortenedItemId
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
            "There was an error retrieving the ticket template for the ticket"
        );
    }

    const errorFromTicketSections = ticketSectionsError(
        ticket.sections,
        ticketTemplate.sections
    );
    if (errorFromTicketSections) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            errorFromTicketSections
        );
    }

    const ticketErrorMessage = validateTicketTitleAndSummary(
        ticket.title,
        ticket.summary
    );
    if (ticketErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            ticketErrorMessage
        );
    }

    let uniqueTicketIdAttempts = 0;
    let ticketId: string;
    let directAccessTicketIdKey: string;

    while (uniqueTicketIdAttempts < 3) {
        ticketId = generateUniqueId();

        directAccessTicketIdKey = createDirectAccessTicketIdKey(
            companyId,
            boardId,
            ticketId
        );

        const ticket = await getItemFromDirectAccessTicketIdIndex<ITicket>(
            directAccessTicketIdKey
        );
        if (ticket === null) {
            break;
        }

        uniqueTicketIdAttempts++;
    }

    const ticketAfterDatabaseCreation = await tryCreateNewItemThreeTimesInPrimaryTable<
        ITicket
    >(() => {
        const sendTicketToBacklog = ticket.startingColumnId === "";
        const itemId = sendTicketToBacklog
            ? createBacklogTicketKey(companyId, boardId, ticketId)
            : createInProgressTicketKey(companyId, boardId, ticketId);
        const belongsTo = sendTicketToBacklog
            ? createAllBacklogTicketsKey(companyId, boardId)
            : createAllInProgressTicketsKey(companyId, boardId);

        const nowTimestamp = Date.now().toString();
        const ticketForDatabase: ITicket = {
            shortenedItemId: ticketId,
            directAccessTicketId: directAccessTicketIdKey,
            itemId,
            belongsTo,
            title: ticket.title,
            summary: ticket.summary,
            sections: ticket.sections,
            ticketTemplateShortenedItemId: ticket.ticketTemplateShortenedItemId,
            createdTimestamp: nowTimestamp,
            lastModifiedTimestamp: nowTimestamp,
            completedTimestamp: "",
            columnId: sendTicketToBacklog ? "" : ticket.startingColumnId,
        };

        return ticketForDatabase;
    });

    if (!ticketAfterDatabaseCreation) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the ticket in the database"
        );
    }

    return createSuccessResponse({
        ticket: ticketAfterDatabaseCreation,
    });
};
