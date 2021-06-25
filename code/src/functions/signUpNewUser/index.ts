import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import {
    CognitoUserPool,
    ISignUpResult,
    NodeCallback,
    ICognitoUserPoolData,
} from "amazon-cognito-identity-js";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { primaryTableName } from "../../constants/primaryTableName";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { ICompanyInformation } from "../../models/database/companyInformation";
import { ICompanyUser } from "../../models/database/companyUser";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

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

    // if they are successfully created, go ahead and create the company and the user in dynamo db

    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    let companyIdAttempts = 0;
    let outputData: AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput | null = null;
    let dynamoDBError: AWS.AWSError | null = null;

    const fullNamePutTogether = name.split(" ").join("").toUpperCase();

    while (companyIdAttempts < 3 && outputData === null) {
        const uniqueCompanyId = generateUniqueId();
        try {
            const companyInformationItem: ICompanyInformation = {
                itemId: `COMPANYINFORMATION_COMPANY.${uniqueCompanyId}`,
                belongsTo: `COMPANY.${uniqueCompanyId}`,
                name: companyName,
            };
            const companyUserItem: ICompanyUser = {
                itemId: `COMPANYUSER.${signUpResultFromCallback.userSub}`,
                belongsTo: `COMPANY.${uniqueCompanyId}`,
                gsiSortKey: `COMPANYUSER_ALPHABETICAL_${fullNamePutTogether}`,
                isCompanyAdmin: true,
                name: name,
            };

            outputData = await dynamoClient
                .transactWrite({
                    TransactItems: [
                        {
                            Put: {
                                TableName: primaryTableName,
                                Item: companyInformationItem,
                                ConditionExpression:
                                    "attribute_not_exists(itemId)",
                            },
                        },
                        {
                            Put: {
                                TableName: primaryTableName,
                                Item: companyUserItem,
                                ConditionExpression:
                                    "attribute_not_exists(itemId)",
                            },
                        },
                    ],
                })
                .promise();
        } catch (error) {
            dynamoDBError = error;
        }
    }

    if (dynamoDBError) {
        return createErrorResponse(
            dynamoDBError.statusCode,
            dynamoDBError.message
        );
    }

    return createSuccessResponse({
        message: "Sign Up Successful",
    });
};
