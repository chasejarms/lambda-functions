import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { ITicketCreateRequest } from "../../models/requests/ticketCreateRequest";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import * as Joi from "joi";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { tryCreateNewItemThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryCreateNewItemThreeTimes";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { createBacklogTicketKey } from "../../keyGeneration/createBacklogTicketKey";
import { createAllBacklogTicketsKey } from "../../keyGeneration/createAllBacklogTicketsKey";
import { ITicket } from "../../models/database/ticket";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createTicketIdForTicketInformationKey } from "../../keyGeneration/createTicketIdForTicketInformationKey";
import { getItemFromTicketIdToTicketInformationIndex } from "../../dynamo/ticketIdToTicketInformation/getItem";

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

    const canCreateTicketForBoard = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );

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
        startingColumnId: Joi.string().allow(""),
    });

    const { error, value } = requestSchema.validate(ticket);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    let uniqueTicketIdAttempts = 0;
    let ticketId: string;
    let ticketIdForTicketInformationKey: string;

    while (uniqueTicketIdAttempts < 3) {
        ticketId = generateUniqueId();

        ticketIdForTicketInformationKey = createTicketIdForTicketInformationKey(
            companyId,
            boardId,
            ticketId
        );

        const ticket = await getItemFromTicketIdToTicketInformationIndex<
            ITicket
        >(ticketIdForTicketInformationKey);
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
            ticketIdForTicketInformation: ticketIdForTicketInformationKey,
            itemId,
            belongsTo,
            title: ticket.title,
            summary: ticket.summary,
            sections: ticket.sections,
            tags: ticket.tags,
            simplifiedTicketTemplate: ticket.simplifiedTicketTemplate,
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
