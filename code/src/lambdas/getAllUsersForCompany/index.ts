import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { isCompanyUser } from "../../utils/isCompanyUser";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";

export const getAllUsersForCompany = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId } = event.queryStringParameters;

    if (!companyId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId is a required query parameter"
        );
    }

    const canGetUsersForCompany = await isCompanyUser(event, companyId);
    if (!canGetUsersForCompany) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get the users for this company"
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

    return createSuccessResponse(users);
};
