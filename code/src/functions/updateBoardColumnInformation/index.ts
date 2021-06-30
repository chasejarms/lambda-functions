import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { IBoardColumnInformationRequest } from "../../models/requests/boardColumnInformationRequest";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { columnDataErrorMessage } from "../../utils/columnDataErrorMessage";
import { createDatabaseColumnsFromRequest } from "../../utils/createDatabaseColumnsFromRequest";
import { isCompanyUserAdminOrBoardAdmin } from "../../utils/isCompanyUserAdminOrBoardAdmin";

export const updateBoardColumnInformation = async (
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

    const { boardId, companyId } = event.queryStringParameters;
    const { columns } = JSON.parse(
        event.body
    ) as IBoardColumnInformationRequest;

    if (!columns || !boardId || !companyId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "columns, boardId, and companyId are required fields"
        );
    }

    const canUpdateBoardColumnInformation = await isCompanyUserAdminOrBoardAdmin(
        event,
        boardId,
        companyId
    );
    if (!canUpdateBoardColumnInformation) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "Insufficient permissions to modify board column information"
        );
    }

    const errorMessageForColumnData = columnDataErrorMessage(columns);

    if (errorMessageForColumnData) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            errorMessageForColumnData
        );
    }

    const databaseColumns = createDatabaseColumnsFromRequest(columns);
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        await dynamoClient.put({
            TableName: primaryTableName,
            Item: {
                itemId: `COLUMNINFORMATION_BOARD.${boardId}`,
                belongsTo: `BOARD.${boardId}`,
                databaseColumns,
            },
        });

        return createSuccessResponse({
            columns: databaseColumns,
        });
    } catch (error) {
        const dynamoDBError = error as AWS.AWSError;
        return createErrorResponse(
            dynamoDBError.statusCode,
            dynamoDBError.message
        );
    }
};
