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
    generateDefaultColumns,
} from "../../constants/reservedBoardColumnData";
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";
import * as Joi from "joi";

export const createBoardForCompanyErrors = {
    insufficientRights:
        "Must be a company user to create boards for this company",
    dynamoError: "Failed to update database",
    companyIdIsRequired: "A company id is required",
    boardNameIsRequired: "A board name is required",
    boardDescriptionIsRequired: "A board description is required",
};

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

    const parsedBody = JSON.parse(event.body);
    const bodySchema = Joi.object({
        companyId: Joi.string()
            .required()
            .error(new Error(createBoardForCompanyErrors.companyIdIsRequired)),
        boardName: Joi.string()
            .required()
            .error(new Error(createBoardForCompanyErrors.boardNameIsRequired)),
        boardDescription: Joi.string()
            .required()
            .error(
                new Error(
                    createBoardForCompanyErrors.boardDescriptionIsRequired
                )
            ),
    });

    const { error } = bodySchema.validate(parsedBody);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const { companyId, boardName, boardDescription } = parsedBody;

    const companyUser = await getUser(event, companyId);

    if (companyUser === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            createBoardForCompanyErrors.insufficientRights
        );
    }

    let boardId: string = "";
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
                    ...generateDefaultColumns(),
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
            ];
        }
    );
    if (!writeWasSuccessful) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            createBoardForCompanyErrors.dynamoError
        );
    }

    return createSuccessResponse({
        id: boardId,
        name: boardName,
        description: boardDescription,
    });
};
