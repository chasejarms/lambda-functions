import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { IBoard } from "../../models/board";
import { getCompanyUser } from "../../utils/getCompanyUser";
import { ICompanyUser } from "../../models/companyUser";
import { parentToChildIndexName } from "../../constants/parentToChildIndexName";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const getBoardsForCompany = async (
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

    const { companyId } = JSON.parse(event.body) as {
        companyId: string;
    };

    if (!companyId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId is a required field"
        );
    }

    let companyUser: ICompanyUser;
    try {
        companyUser = await getCompanyUser(event, companyId);
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
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
                    "itemId = :itemId AND belongsTo begins_with :boardStartingName",
                ExpressionAttributeValues: {
                    ":itemId": `COMPANY.${companyId}`,
                    ":boardStartingName": "BOARD.",
                },
            })
            .promise();

        const boardItems = getBoardResults.Items as IBoard[];
        return createSuccessResponse({
            items: boardItems.map((board) => {
                return {
                    name: board.name,
                    id: board.itemId,
                };
            }),
        });
    } catch (error) {
        const awsError = error as AWS.AWSError;
        return createErrorResponse(awsError.statusCode, awsError.message);
    }
};
