import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { HttpStatusCode } from "../../models/httpStatusCode";
import {
    CognitoUserPool,
    CognitoUserAttribute,
    ISignUpResult,
    NodeCallback,
    ICognitoUserPoolData,
} from "amazon-cognito-identity-js";
import { generateUniqueId } from "../../utils/generateUniqueId";

/**
 * The purpose of this function is just to sign up new users (i.e. never have been added to the system). If
 * a user would like to create another company and already exists on a company, the user will need to
 * be authenticated so that we don't have to verify the passwords match.
 */
export const signUpNewUser = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
        console.log("there is no body");
        const noBodyResponse = JSON.stringify({
            message: "No Body On Request",
        });

        return {
            statusCode: HttpStatusCode.BadRequest,
            body: noBodyResponse,
        };
    }

    try {
        JSON.parse(event.body);
    } catch {
        console.log("the body is not an object");
        const bodyMustBeAnObjectResponse = JSON.stringify({
            message: "Body must be an object",
        });

        return {
            statusCode: HttpStatusCode.BadRequest,
            body: bodyMustBeAnObjectResponse,
        };
    }

    const { companyName, email, password, name } = JSON.parse(event.body) as {
        companyName: string;
        email: string;
        password: string;
        name: string;
    };

    if (!companyName || !email || !password || !name) {
        console.log("not all required fields are provided");
        const requiredFieldsNotProvidedResponse = JSON.stringify({
            message:
                "companyName, email, name, and password are required fields",
        });

        return {
            statusCode: HttpStatusCode.BadRequest,
            body: requiredFieldsNotProvidedResponse,
        };
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
        console.log("issue with user signup: ", userSignUpResponse.body);
        return userSignUpResponse;
    }

    // if they are successfully created, go ahead and create the company and the user in dynamo db

    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    let companyIdAttempts = 0;
    let outputData: AWS.DynamoDB.DocumentClient.TransactWriteItemsOutput | null = null;
    let dynamoDBError: AWS.AWSError | null = null;

    const companyNamePutTogether = companyName
        .split(" ")
        .join("")
        .toUpperCase();

    const fullNamePutTogether = name.split(" ").join("").toUpperCase();

    while (
        companyIdAttempts < 3 &&
        outputData === null &&
        dynamoDBError == null
    ) {
        const uniqueCompanyId = generateUniqueId();
        let resolveCallback: (value?: unknown) => void;
        const promise = new Promise((resolve) => {
            resolveCallback = resolve;
        });

        dynamoClient.transactWrite(
            {
                TransactItems: [
                    {
                        Put: {
                            TableName: "primaryTableOne",
                            Item: {
                                ItemId: `COMPANY_INFORMATION_COMPANYID_${uniqueCompanyId}`,
                                BelongsTo: `COMPANY_${uniqueCompanyId}`,
                                GSISortKey: `COMPANYINFORMATION_ALPHABETICAL_${companyNamePutTogether}`,
                                companyName,
                            },
                            ConditionExpression: "attribute_not_exists(ItemId)",
                        },
                    },
                    {
                        Put: {
                            TableName: "primaryTableOne",
                            Item: {
                                ItemId: `USER_USERID_${signUpResultFromCallback.userSub}`,
                                BelongsTo: `COMPANY_${uniqueCompanyId}`,
                                GSISortKey: `USER_ALPHABETICAL_${fullNamePutTogether}`,
                                Name: name,
                            },
                            ConditionExpression: "attribute_not_exists(ItemId)",
                        },
                    },
                ],
            },
            (error, data) => {
                if (error) {
                    dynamoDBError = error;
                } else {
                    outputData = data;
                }
                resolveCallback();
            }
        );
        await promise;
    }

    if (dynamoDBError) {
        return {
            statusCode: dynamoDBError.statusCode,
            body: JSON.stringify({
                message: dynamoDBError.message,
            }),
        };
    }

    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify({
            message: "Got pretty far on this one right?",
        }),
    };
};
