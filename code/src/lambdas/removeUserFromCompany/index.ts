import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import * as AWS from "aws-sdk";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { IUser } from "../../models/database/user";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import { queryAllItemsFromPartitionInPrimaryTable } from "../../dynamo/primaryTable/queryAllItemsFromPartition";
import { deleteItemFromPrimaryTable } from "../../dynamo/primaryTable/deleteItem";

export const removeUserFromCompany = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "companyId",
        "email"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }
    const { companyId, email } = event.queryStringParameters;

    const emailSchema = Joi.string().email();
    const { error: emailError } = emailSchema.validate(email);
    if (emailError) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            emailError.message
        );
    }

    const requestingUserSub = userSubFromEvent(event);

    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

    let existingCognitoUser: PromiseResult<
        CognitoIdentityServiceProvider.AdminGetUserResponse,
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
        const awsError = error as AWS.AWSError;

        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return createErrorResponse(
            HttpStatusCode.BadRequest,
            awsError.message ||
                "There was an error retrieving the user from cognito"
        );
    }

    const userToDeleteShortenedItemId = existingCognitoUser.Username;
    if (userToDeleteShortenedItemId === requestingUserSub) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Cannot delete your own user"
        );
    }

    const userKey = createUserKey(userToDeleteShortenedItemId);
    const companyUserItems = await queryAllItemsFromPartitionInPrimaryTable<
        IUser
    >(userKey);

    if (companyUserItems.length === 0) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "The user does not exist in the system"
        );
    }

    const userExistsOnCompany = companyUserItems.some((companyUserItem) => {
        const compareCompanyId = companyUserItem.belongsTo.replace(
            "COMPANY.",
            ""
        );
        return compareCompanyId === companyId;
    });

    if (!userExistsOnCompany) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "The user does not exist for this company"
        );
    }

    if (companyUserItems.length === 1) {
        // delete the user from cognito
        const adminDeleteUserParams: CognitoIdentityServiceProvider.Types.AdminDeleteUserRequest = {
            UserPoolId: "us-east-1_hjQ631UTC",
            Username: email,
        };

        try {
            await cognitoIdentityServiceProvider
                .adminDeleteUser(adminDeleteUserParams)
                .promise();
        } catch (error) {
            const awsError = error as AWS.AWSError;

            if (awsError.message && awsError.statusCode) {
                console.log("error message: ", awsError.message);
                console.log("error status code: ", awsError.statusCode);
            }

            return createErrorResponse(
                HttpStatusCode.BadRequest,
                awsError.message ||
                    "There was an error deleting the user in cognito"
            );
        }
    }

    const companyKey = createCompanyKey(companyId);
    const userWasDeletedFromCompany = await deleteItemFromPrimaryTable(
        userKey,
        companyKey
    );

    if (userWasDeletedFromCompany === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error deleting the user from the company"
        );
    }

    return createSuccessResponse({});
};
