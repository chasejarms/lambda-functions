import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isBoardUser } from "../../utils/isBoardUser";
import * as Joi from "joi";
import { createInProgressTicketKey } from "../../keyGeneration/createInProgressTicketKey";
import { createAllInProgressTicketsKey } from "../../keyGeneration/createAllInProgressTicketsKey";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const setAssignedToTicketField = async (
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
        "ticketId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId, boardId, ticketId } = event.queryStringParameters;

    const canAssignTicket = await isBoardUser(event, boardId, companyId);
    if (!canAssignTicket) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to assign this ticket"
        );
    }

    const parsedBody = JSON.parse(event.body) as {
        assignedTo:
            | ""
            | {
                  userId: string;
                  name: string;
              };
    };

    if (parsedBody.assignedTo !== "") {
        const requestSchema = Joi.object({
            assignedTo: Joi.object({
                userId: Joi.string().required(),
                name: Joi.string().required(),
            }),
        });

        const { error } = requestSchema.validate(parsedBody);
        if (error) {
            return createErrorResponse(
                HttpStatusCode.BadRequest,
                error.message
            );
        }
    }

    const inProgressTicketKey = createInProgressTicketKey(
        companyId,
        boardId,
        ticketId
    );
    const allInProgressTicketsKey = createAllInProgressTicketsKey(
        companyId,
        boardId
    );
    const updatedTicket = await overrideSpecificAttributesInPrimaryTable(
        inProgressTicketKey,
        allInProgressTicketsKey,
        {
            assignedTo: parsedBody.assignedTo,
        }
    );

    if (updatedTicket === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the ticket assigned to"
        );
    }

    return createSuccessResponse({});
};
