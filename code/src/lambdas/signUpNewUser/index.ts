import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import {
    CognitoUserPool,
    ISignUpResult,
    NodeCallback,
    ICognitoUserPoolData,
} from "amazon-cognito-identity-js";
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
import { TransactWriteItemType } from "../../dynamo/primaryTable/transactWrite";

/**
 * The purpose of this function is just to sign up new users (i.e. never have been added to the system). If
 * a user would like to create another company and already exists on a company, the user will need to
 * be authenticated so that we don't have to verify the passwords match.
 */
export const signUpNewUser = async (
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

    const { companyName, email, password, name } = JSON.parse(event.body) as {
        companyName: string;
        email: string;
        password: string;
        name: string;
    };

    if (!companyName || !email || !password || !name) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyName, email, name, and password are required fields"
        );
    }

    const poolData: ICognitoUserPoolData = {
        UserPoolId: "us-east-1_hjQ631UTC", // Your user pool id here
        ClientId: "2aklq69d2ba12bpnlo1rsr6kvk", // Your client id here
    };
    const userPool = new CognitoUserPool(poolData);

    let userSignUpResponse: null | APIGatewayProxyResult = null;
    let signUpResultFromCallback: ISignUpResult;
    let callbackComplete = false;

    const callback: NodeCallback<Error, ISignUpResult> = (
        error,
        signUpResult
    ) => {
        if (error) {
            userSignUpResponse = {
                statusCode: HttpStatusCode.BadRequest,
                body: JSON.stringify({
                    message: error.message,
                }),
            };
        }

        signUpResultFromCallback = signUpResult;
        callbackComplete = true;
    };

    userPool.signUp(email, password, [], [], callback);

    while (!callbackComplete) {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, 20);
        });
    }

    if (userSignUpResponse !== null) {
        return createErrorResponse(
            userSignUpResponse.statusCode,
            userSignUpResponse.body
        );
    }

    const transactionWasSuccessful = await tryTransactWriteThreeTimesInPrimaryTable(
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
                email,
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
