import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import * as AWS from "aws-sdk";
import { hasCanManageCompanyUsersRight } from "../../utils/hasCanManageCompanyUsersRight";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";
import { createNewItemInPrimaryTable } from "../../dynamo/primaryTable/createNewItem";
import { createCompanyUserAlphabeticalSortKey } from "../../keyGeneration/createCompanyUserAlphabeticalSortKey";

export const addUserToCompany = async (
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
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }
    const { companyId } = event.queryStringParameters;

    const body = JSON.parse(event.body);
    const addUserRequestSchema = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        canManageCompanyUsers: Joi.bool().required(),
    });

    const { error } = addUserRequestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const { email, name, canManageCompanyUsers } = body as {
        email: string;
        name: string;
        canManageCompanyUsers: boolean;
    };

    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

    const canAddUserToCompany = await hasCanManageCompanyUsersRight(
        event,
        companyId
    );
    if (!canAddUserToCompany) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "Insufficient rights to add a user to this company"
        );
    }

    // Check to see if the user already exists
    let existingCognitoUser: PromiseResult<
        CognitoIdentityServiceProvider.AdminGetUserResponse,
        AWS.AWSError
    > | null = null;

    let newlyCreatedCognitoUser: PromiseResult<
        CognitoIdentityServiceProvider.AdminCreateUserResponse,
        AWS.AWSError
    > | null = null;

    try {
        const getUserParams: CognitoIdentityServiceProvider.Types.AdminGetUserRequest = {
            UserPoolId: "us-east-1_hjQ631UTC",
            Username: email,
        };
        existingCognitoUser = await cognitoIdentityServiceProvider
            .adminGetUser(getUserParams)
            .promise();
    } catch (error) {
        const params: CognitoIdentityServiceProvider.Types.AdminCreateUserRequest = {
            UserPoolId: "us-east-1_hjQ631UTC",
            Username: email,
            DesiredDeliveryMediums: ["EMAIL"],
        };
        try {
            newlyCreatedCognitoUser = await cognitoIdentityServiceProvider
                .adminCreateUser(params)
                .promise();
        } catch (innerError) {
            const awsError = innerError as AWS.AWSError;
            if (awsError.message && awsError.statusCode) {
                console.log("error message: ", awsError.message);
                console.log("error status code: ", awsError.statusCode);
            }

            return createErrorResponse(
                HttpStatusCode.BadRequest,
                "There was an error creating the new user in cognito"
            );
        }
    }

    if (!newlyCreatedCognitoUser && !existingCognitoUser) {
        console.log(
            "there's no created cognito user and no exising cognito user"
        );
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the new user in cognito"
        );
    }

    const userSub = existingCognitoUser
        ? existingCognitoUser.Username
        : newlyCreatedCognitoUser.User.Username;
    const userKey = createUserKey(userSub);
    const companyKey = createCompanyKey(companyId);
    const companyUserAlphabeticalSortKey = createCompanyUserAlphabeticalSortKey(
        name,
        userSub
    );
    const userDatabaseItem: IUser = {
        email,
        itemId: userKey,
        belongsTo: companyKey,
        name,
        gsiSortKey: companyUserAlphabeticalSortKey,
        canManageCompanyUsers,
        isRootUser: false,
        boardRights: {},
        shortenedItemId: userSub,
    };

    const user = await createNewItemInPrimaryTable<IUser>(userDatabaseItem);

    if (user === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Failed to create the user in dynamo"
        );
    }

    return createSuccessResponse(user);
};
