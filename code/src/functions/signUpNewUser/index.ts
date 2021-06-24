import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { HttpStatusCode } from "../../models/httpStatusCode";
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
        UserPoolId: "us-east-1_rXA6mH0CY", // Your user pool id here
        ClientId: "63qoafbc0o0sig2nb23prj88fd", // Your client id here
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
            outputData = await dynamoClient
                .transactWrite({
                    TransactItems: [
                        {
                            Put: {
                                TableName: primaryTableName,
                                Item: {
                                    ItemId: `COMPANYINFORMATION_COMPANY.${uniqueCompanyId}`,
                                    BelongsTo: `COMPANY.${uniqueCompanyId}`,
                                    Name: companyName,
                                },
                                ConditionExpression:
                                    "attribute_not_exists(ItemId)",
                            },
                        },
                        {
                            Put: {
                                TableName: primaryTableName,
                                Item: {
                                    ItemId: `COMPANYUSER.${signUpResultFromCallback.userSub}`,
                                    BelongsTo: `COMPANY.${uniqueCompanyId}`,
                                    GSISortKey: `COMPANYUSER_ALPHABETICAL_${fullNamePutTogether}`,
                                    IsCompanyAdmin: true,
                                    Name: name,
                                },
                                ConditionExpression:
                                    "attribute_not_exists(ItemId)",
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

    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify({
            message: "Sign Up Successful",
        }),
    };
};
