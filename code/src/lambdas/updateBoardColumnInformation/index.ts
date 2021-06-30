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
import { createBoardColumnInformationKey } from "../../keyGeneration/createBoardColumnInformationKey";
import { createCompanyBoardsKey } from "../../keyGeneration/createCompanyBoardsKey";
import { updateItemInPrimaryTable } from "../../dynamo/primaryTable/updateItem";

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
    const boardColumnInformationKey = createBoardColumnInformationKey(
        companyId,
        boardId
    );
    const companyBoardsKey = createCompanyBoardsKey(companyId);

    const wasUpdated = await updateItemInPrimaryTable(
        boardColumnInformationKey,
        companyBoardsKey,
        {
            databaseColumns,
        }
    );

    if (!wasUpdated) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the board column information"
        );
    }

    return createSuccessResponse({
        columns: databaseColumns,
    });
};
