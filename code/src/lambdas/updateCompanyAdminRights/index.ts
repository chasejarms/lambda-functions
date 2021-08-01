import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyUserAdmin } from "../../utils/isCompanyUserAdmin";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";

export const updateCompanyAdminRights = async (
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

    const canUpdateCompanyAdminRights = await isCompanyUserAdmin(
        event,
        companyId
    );
    if (!canUpdateCompanyAdminRights) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the company admin rights for this company"
        );
    }

    const body = JSON.parse(event.body);
    const bodySchema = Joi.object({
        isCompanyAdmin: Joi.bool(),
    });

    const { error } = bodySchema.validate(body);

    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const { isCompanyAdmin } = JSON.parse(event.body) as {
        isCompanyAdmin: boolean;
    };

    const itemId = createUserKey(userToUpdateShortenedItemId);
    const belongsTo = createCompanyKey(companyId);
    const updatedUser = await overrideSpecificAttributesInPrimaryTable<IUser>(
        itemId,
        belongsTo,
        {
            isCompanyAdmin,
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
