import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { BoardRightsAction } from "../../models/requests/boardRightsAction";
import { cloneDeep } from "lodash";

export const updateUserBoardRights = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "companyId",
        "boardId",
        "userToUpdateShortenedItemId",
        "boardRightsAction"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const {
        companyId,
        boardId,
        userToUpdateShortenedItemId,
        boardRightsAction,
    } = event.queryStringParameters;

    const boardRightsActionSchema = Joi.string().allow(
        BoardRightsAction.None,
        BoardRightsAction.Admin,
        BoardRightsAction.User
    );
    const { error } = boardRightsActionSchema.validate(boardRightsAction);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const requestingUserSub = userSubFromEvent(event);
    if (userToUpdateShortenedItemId === requestingUserSub) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Cannot update your own user"
        );
    }

    const canModifyBoardRightsForUser = await isBoardAdmin(
        event,
        boardId,
        companyId
    );
    if (!canModifyBoardRightsForUser) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the user rights for this board"
        );
    }

    const itemId = createUserKey(userToUpdateShortenedItemId);
    const belongsTo = createCompanyKey(companyId);
    const originalUser = await getItemFromPrimaryTable<IUser>(
        itemId,
        belongsTo
    );

    if (originalUser === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error getting the original user from dynamo"
        );
    }

    const updatedBoardRightsAction = cloneDeep(originalUser.boardRights);

    if (boardRightsAction === BoardRightsAction.None) {
        delete updatedBoardRightsAction[boardId];
    } else if (boardRightsAction === BoardRightsAction.Admin) {
        updatedBoardRightsAction[boardId] = {
            isAdmin: true,
        };
    } else if (boardRightsAction === BoardRightsAction.User) {
        updatedBoardRightsAction[boardId] = {
            isAdmin: false,
        };
    }

    const updatedUser = await overrideSpecificAttributesInPrimaryTable<IUser>(
        itemId,
        belongsTo,
        {
            boardRights: updatedBoardRightsAction,
        }
    );

    if (updatedUser === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the user"
        );
    }

    return createSuccessResponse(updatedUser);
};
