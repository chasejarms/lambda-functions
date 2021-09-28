import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { ticketTemplateCreateRequestErrorMessage } from "../../dataValidation/ticketTemplateCreateRequestErrorMessage";
import { ITicketTemplateCreateRequest } from "../../models/requests/ticketTemplateCreateRequest";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import { tryTransactWriteThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";
import { queryStringParametersError } from "../../utils/queryStringParametersError";

export const createTicketTemplateForBoardErrors = {
    ticketTemplateIsRequiredField: "ticketTemplate is a required field",
    insufficientRights: "must be a board admin to create ticket templates",
    errorCreatingTemplate: "Error creating the ticket template",
};

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

    const error = queryStringParametersError(
        event.queryStringParameters,
        "companyId",
        "boardId"
    );
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error);
    }

    const { companyId, boardId } = event.queryStringParameters;

    const { ticketTemplate } = JSON.parse(event.body) as {
        ticketTemplate: ITicketTemplateCreateRequest;
    };
    if (!ticketTemplate) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            createTicketTemplateForBoardErrors.ticketTemplateIsRequiredField
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

    const canCreateTicketTemplateForBoard = await isBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canCreateTicketTemplateForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            createTicketTemplateForBoardErrors.insufficientRights
        );
    }

    const ticketTemplateLogicWasCreated = await tryTransactWriteThreeTimesInPrimaryTable(
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
            const ticketTemplateForDatabase: ITicketTemplate = {
                itemId: boardTicketTemplateKey,
                belongsTo: allBoardTicketTemplatesKey,
                shortenedItemId: boardTicketTemplateId,
                ...ticketTemplate,
            };

            return [
                {
                    type: TransactWriteItemType.Put,
                    item: ticketTemplateForDatabase,
                    canOverrideExistingItem: false,
                },
            ];
        }
    );

    if (ticketTemplateLogicWasCreated === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            createTicketTemplateForBoardErrors.errorCreatingTemplate
        );
    }

    return createSuccessResponse({});
};
