import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";
import { hasCanManageCompanyUsersRight } from "../../utils/hasCanManageCompanyUsersRight.ts";
import { userSubFromEvent } from "../../utils/userSubFromEvent";

export const updateCanManageCompanyUsers = async (
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
        "companyId",
        "userToUpdateShortenedItemId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const {
        companyId,
        userToUpdateShortenedItemId,
    } = event.queryStringParameters;

    const requestingUserSub = userSubFromEvent(event);
    if (userToUpdateShortenedItemId === requestingUserSub) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Cannot update your own user"
        );
    }

    const canAddManageUsersRights = await hasCanManageCompanyUsersRight(
        event,
        companyId
    );
    if (!canAddManageUsersRights) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the user management rights for this company"
        );
    }

    const body = JSON.parse(event.body);
    const bodySchema = Joi.object({
        canManageCompanyUsers: Joi.bool(),
    });

    const { error } = bodySchema.validate(body);

    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const { canManageCompanyUsers } = body as {
        canManageCompanyUsers: boolean;
    };

    const itemId = createUserKey(userToUpdateShortenedItemId);
    const belongsTo = createCompanyKey(companyId);
    const updatedUser = await overrideSpecificAttributesInPrimaryTable<IUser>(
        itemId,
        belongsTo,
        {
            canManageCompanyUsers,
        }
    );

    if (updatedUser === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error updating the user"
        );
    }

    return createSuccessResponse({});
};
