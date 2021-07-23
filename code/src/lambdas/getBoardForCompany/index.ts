import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { createCompanyBoardKey } from "../../keyGeneration/createCompanyBoardKey";
import { createCompanyBoardsKey } from "../../keyGeneration/createCompanyBoardsKey";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { IBoard } from "../../models/database/board";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const getBoardColumnInformation = async (
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

    const canGetBoardForCompany = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canGetBoardForCompany) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to delete this board"
        );
    }

    const companyBoardKey = createCompanyBoardKey(companyId, boardId);
    const companyBoardsKey = createCompanyBoardsKey(companyId);

    const board = await getItemFromPrimaryTable<IBoard>(
        companyBoardKey,
        companyBoardsKey
    );

    if (board === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "could not find the given board"
        );
    }

    return createSuccessResponse(board);
};
