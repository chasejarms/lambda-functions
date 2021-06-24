import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { isCompanyUserAdmin } from "../../utils/isCompanyUserAdmin";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { userSubFromEvent } from "../../utils/userSubFromEvent";

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

    const canCreateBoard = await isCompanyUserAdmin(event, companyId);
    if (!canCreateBoard) {
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
            outputData = await dynamoClient
                .transactWrite(
                    {
                        TransactItems: [
                            {
                                Put: {
                                    TableName: primaryTableName,
                                    Item: {
                                        ItemId: `BOARD.${boardId}`,
                                        BelongsTo: `COMPANY.${companyId}`,
                                        Name: boardName,
                                        Description: boardDescription,
                                    },
                                    ConditionExpression:
                                        "attribute_not_exists(ItemId)",
                                },
                            },
                            {
                                Put: {
                                    TableName: primaryTableName,
                                    Item: {
                                        ItemId: `BOARDUSER.${userSub}_BOARD.${boardId}`,
                                        BelongsTo: `COMPANY.${companyId}`,
                                        IsBoardAdmin: true,
                                    },
                                    ConditionExpression:
                                        "attribute_not_exists(ItemId)",
                                },
                            },
                        ],
                    },
                    (error, data) => {
                        if (error) {
                            dynamoDBError = error;
                        } else {
                            outputData = data;
                        }
                    }
                )
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

    const boardItem = outputData.ItemCollectionMetrics[primaryTableName].find(
        (itemCollectionMetrics) => {
            return (
                itemCollectionMetrics.ItemCollectionKey["ItemId"] ===
                `BOARD.${boardId}`
            );
        }
    );

    return {
        statusCode: HttpStatusCode.Ok,
        body: "",
    };
};
