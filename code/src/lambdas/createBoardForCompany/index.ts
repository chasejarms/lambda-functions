import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { IBoard } from "../../models/database/board";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyUser } from "../../utils/isCompanyUser";
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
import { createBoardPriorityKey } from "../../keyGeneration/createBoardPriorityKey";
import { IBoardPriorityList } from "../../models/database";
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";

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
            "companyId, boardName, and boardDescription are required fields."
        );
    }

    const canCreateBoard = await isCompanyUser(event, companyId);

    if (!canCreateBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to create board"
        );
    }

    const companyUser = await getUser(event, companyId);

    if (companyUser === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Unable to get the user on the company"
        );
    }

    let boardId: string;
    const writeWasSuccessful = await tryTransactWriteThreeTimesInPrimaryTable(
        () => {
            boardId = generateUniqueId(1);

            const companyBoardKey = createCompanyBoardKey(companyId, boardId);
            const companyBoardsKey = createCompanyBoardsKey(companyId);
            const boardItem: IBoard = {
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
            const boardTicketTemplateKey = createBoardTicketTemplateKey(
                companyId,
                boardId,
                boardTicketTemplateId
            );
            const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
                companyId,
                boardId
            );
            const ticketTemplate: ITicketTemplate = {
                itemId: boardTicketTemplateKey,
                belongsTo: allBoardTicketTemplatesKey,
                shortenedItemId: boardTicketTemplateId,
                name: "Default",
                description: "Default ticket template description.",
                title: {
                    label: "Ticket Title",
                },
                summary: {
                    isRequired: false,
                    label: "Ticket Summary",
                },
                sections: [],
            };

            const boardPriorityListKey = createBoardPriorityKey(
                companyId,
                boardId
            );
            const boardPriorityList: IBoardPriorityList = {
                itemId: boardPriorityListKey,
                belongsTo: boardPriorityListKey,
                priorities: [],
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
                    item: ticketTemplate,
                    canOverrideExistingItem: false,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: boardPriorityList,
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
