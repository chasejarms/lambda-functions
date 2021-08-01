import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createCompanyBoardKey } from "../../keyGeneration/createCompanyBoardKey";
import { createCompanyBoardsKey } from "../../keyGeneration/createCompanyBoardsKey";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { IBoard } from "../../models/database/board";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isBoardAdmin } from "../../utils/isBoardAdmin";

export const deleteBoardForCompany = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
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

    const { companyId, boardId } = event.queryStringParameters;

    const canDeleteBoardForCompany = await isBoardAdmin(
        event,
        boardId,
        companyId
    );
    if (!canDeleteBoardForCompany) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to delete this board"
        );
    }

    const companyBoardKey = createCompanyBoardKey(companyId, boardId);
    const companyBoardsKey = createCompanyBoardsKey(companyId);

    await overrideSpecificAttributesInPrimaryTable<IBoard>(
        companyBoardKey,
        companyBoardsKey,
        {
            hasBeenDeleted: true,
        },
        true
    );

    return createSuccessResponse({});
};
