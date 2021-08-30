import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { ICompanyInformation } from "../../models/database/companyInformation";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { createCompanyInformationKey } from "../../keyGeneration/createCompanyInformationKey";
import { createAllCompaniesKey } from "../../keyGeneration/createAllCompaniesKey";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { createCompanyUserAlphabeticalSortKey } from "../../keyGeneration/createCompanyUserAlphabeticalSortKey";
import { IUser } from "../../models/database/user";
import { tryTransactWriteThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import * as Joi from "joi";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import * as AWS from "aws-sdk";
import { PromiseResult } from "aws-sdk/lib/request";
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";

/**
 * The purpose of this function is to create an additional company for an already authenticated user.
 */
export const authenticatedCreateNewCompany = async (
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

    const requestSchema = Joi.object({
        companyName: Joi.string().required(),
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        secretKey: Joi.string().required(),
    });
    const body = JSON.parse(event.body) as {
        companyName: string;
        email: string;
        name: string;
        secretKey: string;
    };

    const { error } = requestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const { companyName, email, secretKey, name } = body;

    if (secretKey !== "adifj090023") {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Invalid key provided"
        );
    }

    const userSub = userSubFromEvent(event);

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

        if (existingCognitoUser.Username !== userSub) {
            return createErrorResponse(
                HttpStatusCode.BadRequest,
                "The user sub does not match the user sub of the passed in email"
            );
        }
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error getting the user in cognito"
        );
    }

    const transactionWasSuccessful = await tryTransactWriteThreeTimesInPrimaryTable(
        () => {
            const uniqueCompanyId = generateUniqueId();

            const companyInformationKey = createCompanyInformationKey(
                uniqueCompanyId
            );
            const allCompaniesKey = createAllCompaniesKey();
            const date = new Date();
            const companyInformationItem: ICompanyInformation = {
                itemId: companyInformationKey,
                belongsTo: allCompaniesKey,
                name: companyName,
                shortenedItemId: uniqueCompanyId,
                created: date.toISOString(),
            };

            const userKey = createUserKey(userSub);
            const companyKey = createCompanyKey(uniqueCompanyId);
            const companyUserAlphabeticalSortKey = createCompanyUserAlphabeticalSortKey(
                name,
                userSub
            );

            const companyUserItem: IUser = {
                email,
                itemId: userKey,
                belongsTo: companyKey,
                gsiSortKey: companyUserAlphabeticalSortKey,
                isRootUser: true,
                canManageCompanyUsers: true,
                boardRights: {},
                name: name,
                shortenedItemId: userSub,
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
        message: "The additional company has been created",
    });
};
