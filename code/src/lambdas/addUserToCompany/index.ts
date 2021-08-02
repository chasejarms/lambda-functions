import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import * as AWS from "aws-sdk";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { hasCanManageCompanyUsersRight } from "../../utils/hasCanManageCompanyUsersRight.ts";

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
    });

    const { error } = addUserRequestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const { email, name } = body as {
        email: string;
        name: string;
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
    try {
        const user = await cognitoIdentityServiceProvider
            .adminGetUser()
            .promise();
        if (user && user.Username) {
            return createErrorResponse(
                HttpStatusCode.BadRequest,
                "The user already exists for this company"
            );
        }
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "The user already exists for this company"
        );
    }

    const params: CognitoIdentityServiceProvider.Types.AdminCreateUserRequest = {
        UserPoolId: "us-east-1_hjQ631UTC",
        Username: email,
        DesiredDeliveryMediums: ["EMAIL"],
    };
    try {
        await cognitoIdentityServiceProvider.adminCreateUser(params).promise();
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the new user in cognito"
        );
    }

    const transactionWasSuccessful = await tryCreateNewItemThreeTimesInPrimaryTable(
        () => {
            const uniqueCompanyId = generateUniqueId();

            const companyInformationKey = createCompanyInformationKey(
                uniqueCompanyId
            );
            const allCompaniesKey = createAllCompaniesKey();
            const companyInformationItem: ICompanyInformation = {
                itemId: companyInformationKey,
                belongsTo: allCompaniesKey,
                name: companyName,
            };

            const userKey = createUserKey(signUpResultFromCallback.userSub);
            const companyKey = createCompanyKey(uniqueCompanyId);
            const companyUserAlphabeticalSortKey = createCompanyUserAlphabeticalSortKey(
                name,
                signUpResultFromCallback.userSub
            );
            const companyUserItem: IUser = {
                itemId: userKey,
                belongsTo: companyKey,
                gsiSortKey: companyUserAlphabeticalSortKey,
                isRootUser: true,
                canManageCompanyUsers: true,
                boardRights: {},
                name: name,
                shortenedItemId: signUpResultFromCallback.userSub,
            };

            return [
                {
                    type: TransactWriteItemType.Put,
                    item: companyInformationItem,
                    canOverrideExistingItem: false,
                },
                {
                    type: TransactWriteItemType.Put,
                    item: companyUserItem,
                    canOverrideExistingItem: false,
                },
            ];
        }
    );

    if (!transactionWasSuccessful) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Failed to write the data three times"
        );
    }

    return createSuccessResponse({
        message: "Sign Up Successful",
    });
};
