import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { IBoardColumnInformation } from "../../models/boardColumnInformation";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { ICompanyUser } from "../../models/companyUser";
import { getCompanyUser } from "../../utils/getCompanyUser";
import { IBoardUser } from "../../models/boardUser";
import { getBoardUser } from "../../utils/getBoardUser";
import { generateUniqueId } from "../../utils/generateUniqueId";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyAdminOrBoardAdmin } from "../../utils/isCompanyAdminOrBoardAdmin";

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

    const { columnInformation, boardId, companyId } = JSON.parse(
        event.body
    ) as {
        columnInformation: IBoardColumnInformation;
        boardId: string;
        companyId: string;
    };

    if (!columnInformation || !boardId || !companyId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "columnInformation, boardId, and companyId are required fields"
        );
    }

    const canUpdateBoardColumnInformation = await isCompanyAdminOrBoardAdmin(
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

    const existingColumnIds = columnInformation.columns.reduce<{
        [id: string]: boolean;
    }>((mapping, { id }) => {
        mapping[id] = true;
        return mapping;
    }, {});

    const updatedColumnInformation = columnInformation.columns.map((column) => {
        if (column.id) {
            return column;
        }

        let generatedIdIsUnique = false;
        let generatedId: string;
        while (!generatedIdIsUnique) {
            generatedId = generateUniqueId(1);
            generatedIdIsUnique = existingColumnIds[generatedId] === undefined;
        }

        existingColumnIds[generatedId] = true;

        return {
            id: generatedId,
            name: column.name,
        };
    });

    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        await dynamoClient.put({
            TableName: primaryTableName,
            Item: {
                itemId: `COLUMNINFORMATION_BOARD.${boardId}`,
                belongsTo: `BOARD.${boardId}`,
                updatedColumnInformation,
            },
        });

        return createSuccessResponse({
            updatedColumnInformation,
        });
    } catch (error) {
        const dynamoDBError = error as AWS.AWSError;
        return createErrorResponse(
            dynamoDBError.statusCode,
            dynamoDBError.message
        );
    }
};
