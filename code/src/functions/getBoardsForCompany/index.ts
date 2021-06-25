import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { IBoard } from "../../models/database/board";
import { getCompanyUser } from "../../utils/getCompanyUser";
import { ICompanyUser } from "../../models/database/companyUser";
import { parentToChildIndexName } from "../../constants/parentToChildIndexName";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const getBoardsForCompany = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { companyId } = event.queryStringParameters;

    if (!companyId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId is a required query parameter"
        );
    }

    let companyUser: ICompanyUser;
    try {
        companyUser = await getCompanyUser(event, companyId);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a user on the company to get boards for the company"
        );
    }

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    try {
        const getBoardResults = await dynamoClient
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
