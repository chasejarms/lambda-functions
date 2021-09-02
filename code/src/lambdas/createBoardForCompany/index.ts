import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { IBoard } from "../../models/database/board";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { getUser } from "../../utils/getUser";
import { createCompanyBoardsKey } from "../../keyGeneration/createCompanyBoardsKey";
import { createCompanyBoardKey } from "../../keyGeneration/createCompanyBoardKey";
import { IUser } from "../../models/database/user";
import { tryTransactWriteThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import { createBoardColumnInformationKey } from "../../keyGeneration/createBoardColumnInformationKey";
import { IBoardColumnInformation } from "../../models/database/boardColumnInformation";
import {
    defaultUncategorizedColumn,
    defaultInProgressColumn,
    defaultDoneColumn,
} from "../../constants/reservedBoardColumnData";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";
import { IWeightingFunction } from "../../models/database/weightingFunction";
import { createBoardWeightingFunctionKey } from "../../keyGeneration/createBoardWeightingFunctionKey";
import { createAllBoardWeightingFunctionsKey } from "../../keyGeneration/createAllBoardWeightingFunctionsKey";

export const createBoardForCompany = async (
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

    const { companyId, boardName, boardDescription } = JSON.parse(
        event.body
    ) as {
        companyId: string;
        boardName: string;
        boardDescription: string;
    };

    if (!companyId || !boardName || !boardDescription) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId, boardName, boardDescription, and priority type are required fields."
        );
    }

    const companyUser = await getUser(event, companyId);

    if (companyUser === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient rights, must be a company user to create boards for this company"
        );
    }

    let boardId: string;
    const writeWasSuccessful = await tryTransactWriteThreeTimesInPrimaryTable(
        () => {
            boardId = generateUniqueId(2);

            const companyBoardKey = createCompanyBoardKey(companyId, boardId);
            const companyBoardsKey = createCompanyBoardsKey(companyId);
            const boardItem: IBoard = {
                shortenedItemId: boardId,
                itemId: companyBoardKey,
                belongsTo: companyBoardsKey,
                name: boardName,
                description: boardDescription,
            };

            const boardColumnInformationKey = createBoardColumnInformationKey(
                companyId,
                boardId
            );
            const boardColumnInformation: IBoardColumnInformation = {
                itemId: boardColumnInformationKey,
                belongsTo: boardColumnInformationKey,
                columns: [
                    defaultUncategorizedColumn,
                    defaultInProgressColumn,
                    defaultDoneColumn,
                ],
            };

            const currentBoardRights = companyUser.boardRights;
            const updatedUserItem: IUser = {
                ...companyUser,
                boardRights: {
                    ...currentBoardRights,
                    [boardId]: {
                        isAdmin: true,
                    },
                },
            };

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
                name: "Default",
                description: "Default ticket template description.",
                title: {
                    label: "Ticket Title",
                },
                summary: {
                    label: "Ticket Summary",
                },
                sections: [],
            };

            const ticketTemplateV1: ITicketTemplate = {
                itemId: boardTicketTemplateKeyV1,
                belongsTo: allBoardTicketTemplatesKey,
                shortenedItemId: boardTicketTemplateId,
                name: "Default",
                description: "Default ticket template description.",
                title: {
                    label: "Ticket Title",
                },
                summary: {
                    label: "Ticket Summary",
                },
                sections: [],
            };

            // create the function

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
                    item: boardItem,
                    canOverrideExistingItem: false,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: updatedUserItem,
                    canOverrideExistingItem: true,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: boardColumnInformation,
                    canOverrideExistingItem: false,
                },
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
    if (!writeWasSuccessful) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Unable to create the board and user"
        );
    }

    return createSuccessResponse({
        id: boardId,
        name: boardName,
        description: boardDescription,
    });
};
