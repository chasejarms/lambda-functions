import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as AWS from "aws-sdk";
import { HttpStatusCode } from "../../models/httpStatusCode";
import {
    CognitoUserPool,
    CognitoUserAttribute,
    ISignUpResult,
    NodeCallback,
} from "amazon-cognito-identity-js";
import { generateUniqueId } from "../../utils/generateUniqueId";

const poolData = {
    UserPoolId: "us-east-1_etBRMChzv", // Your user pool id here
    ClientId: "5qi8l41f3comtq810u0b573i2q", // Your client id here
};
const userPool = new CognitoUserPool(poolData);

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

    const attributeList = [];
    attributeList.push(
        new CognitoUserAttribute({
            Name: "name",
            Value: name,
        })
    );

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

    userPool.signUp(email, password, attributeList, [], callback);

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
    let successfullyCreatedData = false;
    let dynamoTransationCallbackCompletions = 0;

    const companyNamePutTogether = companyName
        .split(" ")
        .join("")
        .toUpperCase();
    while (companyIdAttempts < 3 && !successfullyCreatedData) {
        const uniqueCompanyId = generateUniqueId();

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
                                ItemId: `USER_USERID_${signUpResultFromCallback}`,
                            },
                            ConditionExpression: "attribute_not_exists(ItemId)",
                        },
                    },
                ],
            },
            (error, data) => {
                if (error) {
                    console.log("error writing to dynamo: ", error.message);
                }
                dynamoTransationCallbackCompletions += 1;
            }
        );
    }

    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify({
            message: "Got pretty far on this one right?",
        }),
    };
};
