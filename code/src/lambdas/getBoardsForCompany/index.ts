import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { IBoard } from "../../models/database/board";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyUser } from "../../utils/isCompanyUser";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { createCompanyBoardsKey } from "../../keyGeneration/createCompanyBoardsKey";
import { createStartOfBoardKey } from "../../keyGeneration/createStartOfBoardKey";
import { getUser } from "../../utils/getUser";

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

    const user = await getUser(event, companyId);
    const canGetBoardsForCompany = user !== null;
    if (!canGetBoardsForCompany) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a user on the company to get boards for the company"
        );
    }

    const companyBoardsKey = createCompanyBoardsKey(companyId);
    const startOfBoardKey = createStartOfBoardKey(companyId);
    const boardItems = await queryParentToChildIndexBeginsWith<IBoard>(
        startOfBoardKey,
        companyBoardsKey
    );

    if (boardItems === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the boards from dynamo"
        );
    }

    return createSuccessResponse({
        items: boardItems.filter((board) => {
            const userHasAccessToBoard = !!user.boardRights[
                board.shortenedItemId
            ];
            return userHasAccessToBoard && !board.hasBeenDeleted;
        }),
    });
};
