import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { IBoardColumnInformationRequest } from "../../models/requests/boardColumnInformationRequest";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { columnDataErrorMessage } from "../../utils/columnDataErrorMessage";
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

    const boardColumnInformationKey = createBoardColumnInformationKey(
        companyId,
        boardId
    );

    const wasUpdated = await updateItemInPrimaryTable(
        boardColumnInformationKey,
        boardColumnInformationKey,
        {
            columns,
        }
    );

    if (!wasUpdated) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the board column information"
        );
    }

    return createSuccessResponse({
        columns,
    });
};
