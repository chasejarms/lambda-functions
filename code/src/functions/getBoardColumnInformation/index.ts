import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { IBoard } from "../../models/database/board";
import { parentToChildIndexName } from "../../constants/parentToChildIndexName";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyAdminOrBoardAdmin } from "../../utils/isCompanyUserAdminOrBoardAdmin";
import { isCompanyUser } from "../../utils/isCompanyUser";

export const getBoardColumnInformation = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { boardId, companyId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameters"
        );
    }

    const hasSufficientRights = await isCompanyUser(
        event,
        companyId,
    );
    if (!hasSufficientRights) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a user on the company to get boards for the company"
        );
    }

    try {
        await 
    }

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    try {
        const getBoardColumnResults = await dynamoClient
            .query({
                TableName: primaryTableName,
                IndexName: parentToChildIndexName,
                KeyConditionExpression:
                    "belongsTo = :companyId AND begins_with ( itemId, :boardStartingName )",
                ExpressionAttributeValues: {
                    ":companyId": `COMPANY.${companyId}`,
                    ":boardStartingName": "BOARD.",
                },
            })
            .promise();

        const boardItems = getBoardResults.Items as IBoard[];
        return createSuccessResponse({
            items: boardItems.map((board) => {
                const boardId = board.itemId.split(".")[1];
                return {
                    name: board.name,
                    id: boardId,
                };
            }),
        });
    } catch (error) {
        const awsError = error as AWS.AWSError;
        return createErrorResponse(awsError.statusCode, awsError.message);
    }
};
