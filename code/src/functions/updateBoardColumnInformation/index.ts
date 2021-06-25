import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { IBoardColumnInformationRequest } from "../../models/requests/boardColumnInformationRequest";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { generateUniqueId } from "../../utils/generateUniqueId";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyAdminOrBoardAdmin } from "../../utils/isCompanyAdminOrBoardAdmin";
import { IBoardColumn } from "../../models/database/boardColumns";

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

    const { columns, boardId, companyId } = JSON.parse(
        event.body
    ) as IBoardColumnInformationRequest;

    if (!columns || !boardId || !companyId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "columns, boardId, and companyId are required fields"
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

    // start here tomorrow
    let uncategorizedColumnIsValid = true;
    let doneColumnIsValid = true;
    let otherColumnsAreValid = true;
    let uncategorizedColumnCount = 0;
    let doneColumnCount = 0;

    const columnModificationIsValid = columns.forEach((column) => {
        if (column.name === "INTERNAL:Uncategorized") {
            uncategorizedColumnIsValid = !column.canBeModified;
            uncategorizedColumnCount++;
        } else if (column.name === "INTERNAL:Done") {
            doneColumnIsValid = !column.canBeModified;
            doneColumnCount++;
        } else if (otherColumnsAreValid) {
            otherColumnsAreValid = column.canBeModified;
        }
    });

    if (!uncategorizedColumnIsValid) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Cannot modify the "
        );
    }

    const existingColumnIds = columns.reduce<{
        [id: string]: boolean;
    }>((mapping, { id }) => {
        mapping[id] = true;
        return mapping;
    }, {});

    const updatedColumnInformation: IBoardColumn[] = columns.map((column) => {
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
            canUpdateBoardColumnInformation:
                column.canUpdateBoardColumnInformation,
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
