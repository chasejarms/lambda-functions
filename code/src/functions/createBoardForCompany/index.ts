import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import { IBoard } from "../../models/database/board";
import { IBoardUser } from "../../models/database/boardUser";
import { getCompanyUser } from "../../utils/getCompanyUser";
import { ICompanyUser } from "../../models/database/companyUser";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

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

    let companyUser: ICompanyUser;
    try {
        companyUser = await getCompanyUser(event, companyId);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to create board"
        );
    }

    const userSub = userSubFromEvent(event);

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    let createBoardIdAttempts = 0;
    let outputData: AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput | null = null;
    let dynamoDBError: AWS.AWSError | null = null;
    let boardId: string;

    while (createBoardIdAttempts < 3 && outputData === null) {
        boardId = generateUniqueId(1);
        try {
            const boardItem: IBoard = {
                itemId: `BOARD.${boardId}`,
                belongsTo: `COMPANY.${companyId}`,
                name: boardName,
                description: boardDescription,
            };

            const boardUserItem: IBoardUser = {
                itemId: `BOARDUSER.${userSub}_BOARD.${boardId}`,
                belongsTo: `COMPANY.${companyId}`,
                isBoardAdmin: true,
                name: companyUser.name,
            };

            outputData = await dynamoClient
                .transactWrite({
                    TransactItems: [
                        {
                            Put: {
                                TableName: primaryTableName,
                                Item: boardItem,
                                ConditionExpression:
                                    "attribute_not_exists(itemId)",
                            },
                        },
                        {
                            Put: {
                                TableName: primaryTableName,
                                Item: boardUserItem,
                                ConditionExpression:
                                    "attribute_not_exists(itemId)",
                            },
                        },
                    ],
                })
                .promise();
        } catch (error) {
            dynamoDBError = error;
        }
    }

    if (dynamoDBError) {
        return createErrorResponse(
            dynamoDBError.statusCode,
            dynamoDBError.message
        );
    }

    return createSuccessResponse({
        id: boardId,
        name: boardName,
        description: boardDescription,
    });
};
