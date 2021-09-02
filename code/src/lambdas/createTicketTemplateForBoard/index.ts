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
import { ITicketTemplatePutRequest } from "../../models/requests/ticketTemplatePutRequest";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import { tryTransactWriteThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";
import { createAllBoardWeightingFunctionsKey } from "../../keyGeneration/createAllBoardWeightingFunctionsKey";
import { IWeightingFunction } from "../../models/database/weightingFunction";
import { createBoardWeightingFunctionKey } from "../../keyGeneration/createBoardWeightingFunctionKey";

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

    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameter"
        );
    }

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

    const canCreateTicketTemplateForBoard = await isBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canCreateTicketTemplateForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board admin to create ticket templates"
        );
    }

    const ticketTemplateLogicWasCreated = await tryTransactWriteThreeTimesInPrimaryTable(
        () => {
            const boardTicketTemplateId = generateUniqueId(1);
            const boardTicketTemplateKeyV0 = createBoardTicketTemplateKey(
                companyId,
                boardId,
                boardTicketTemplateId,
                0
            );
            const boardTicketTemplateKeyV1 = createBoardTicketTemplateKey(
                companyId,
                boardId,
                boardTicketTemplateId,
                1
            );
            const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
                companyId,
                boardId
            );
            const ticketTemplateV0: ITicketTemplate = {
                itemId: boardTicketTemplateKeyV0,
                belongsTo: allBoardTicketTemplatesKey,
                shortenedItemId: boardTicketTemplateId,
                ...ticketTemplate,
            };

            const ticketTemplateV1: ITicketTemplate = {
                itemId: boardTicketTemplateKeyV1,
                belongsTo: allBoardTicketTemplatesKey,
                shortenedItemId: boardTicketTemplateId,
                ...ticketTemplate,
            };

            const weightingFunctionId = generateUniqueId(2);
            const boardWeightingFunctionKeyV0 = createBoardWeightingFunctionKey(
                companyId,
                boardId,
                weightingFunctionId,
                0
            );

            const boardWeightingFunctionKeyV1 = createBoardWeightingFunctionKey(
                companyId,
                boardId,
                weightingFunctionId,
                1
            );

            const allBoardWeightingFunctionsKey = createAllBoardWeightingFunctionsKey(
                companyId,
                boardId
            );

            const weightingFunctionV0: IWeightingFunction = {
                itemId: boardWeightingFunctionKeyV0,
                belongsTo: allBoardWeightingFunctionsKey,
                function: "",
            };

            const weightingFunctionV1: IWeightingFunction = {
                itemId: boardWeightingFunctionKeyV1,
                belongsTo: allBoardWeightingFunctionsKey,
                function: "",
            };

            return [
                {
                    type: TransactWriteItemType.Put,
                    item: ticketTemplateV0,
                    canOverrideExistingItem: false,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: ticketTemplateV1,
                    canOverrideExistingItem: false,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: weightingFunctionV0,
                    canOverrideExistingItem: false,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: weightingFunctionV1,
                    canOverrideExistingItem: false,
                },
            ];
        }
    );

    if (ticketTemplateLogicWasCreated === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error creating the ticket template"
        );
    }

    return createSuccessResponse({});
};
