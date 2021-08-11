import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";
import { isBoardUser } from "../../utils/isBoardUser";

export const getAllUsersForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "companyId",
        "boardId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId, boardId } = event.queryStringParameters;

    const canGetUsersForBoard = await isBoardUser(event, boardId, companyId);
    if (!canGetUsersForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get the users for this board"
        );
    }

    const companyKey = createCompanyKey(companyId);
    const users = await queryParentToChildIndexBeginsWith<IUser>(
        "USER.",
        companyKey
    );

    if (users === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the users from dynamo"
        );
    }

    const onlyUsersForBoard = users.filter((user) => {
        const userHasAccessToBoard = user.boardRights[boardId];
        return userHasAccessToBoard;
    });

    return createSuccessResponse(onlyUsersForBoard);
};
