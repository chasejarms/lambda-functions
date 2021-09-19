import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { IBoardColumnInformationRequest } from "../../models/requests/boardColumnInformationRequest";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { columnDataErrorMessage } from "../../dataValidation/columnDataErrorMessage";
import { createBoardColumnInformationKey } from "../../keyGeneration/createBoardColumnInformationKey";
import { overrideItemInPrimaryTable } from "../../dynamo/primaryTable/overrideItem";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import { queryStringParametersError } from "../../utils/queryStringParametersError";

export const updateBoardColumnInformationErrors = {
    columnsRequiredOnRequestBody:
        "columns is a required field on the request body",
    insufficientPermissions:
        "Insufficient permissions to modify board column information",
};

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

    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { boardId, companyId } = event.queryStringParameters;
    const { columns } = JSON.parse(
        event.body
    ) as IBoardColumnInformationRequest;

    if (!columns) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            updateBoardColumnInformationErrors.columnsRequiredOnRequestBody
        );
    }

    const canUpdateBoardColumnInformation = await isBoardAdmin(
        event,
        boardId,
        companyId
    );
    if (!canUpdateBoardColumnInformation) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            updateBoardColumnInformationErrors.insufficientPermissions
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

    const wasUpdated = await overrideItemInPrimaryTable(
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
