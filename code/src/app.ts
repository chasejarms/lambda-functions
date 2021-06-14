import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "./models/httpStatusCode";
import * as AWSCognitoIdentity from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "us-east-1_rh9H8whcD", // Your user pool id here
    ClientId: "6gc6tovbdh8k56o4svgec2kdih", // Your client id here
};
const userPool = new AWSCognitoIdentity.CognitoUserPool(poolData);

/**
 * The purpose of this function is just to sign up new users (i.e. never have been added to the system). If
 * a user would like to create another company and already exists on a company, the user will need to
 * be authenticated so that we don't have to verify the passwords match.
 */
export const signUpNewUserHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    if (!event.body) {
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
        const bodyMustBeAnObjectResponse = JSON.stringify({
            message: "Body must be an object",
        });

        return {
            statusCode: HttpStatusCode.BadRequest,
            body: bodyMustBeAnObjectResponse,
        };
    }

    const { companyName, email, password, name } = JSON.parse(event.body);

    if (!companyName || !email || !password || !name) {
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
        new AWSCognitoIdentity.CognitoUserAttribute({
            Name: "name",
            Value: name,
        })
    );

    let userSignUpResponse: null | APIGatewayProxyResult = null;
    let callbackComplete = false;

    const callback: AWSCognitoIdentity.NodeCallback<
        Error,
        AWSCognitoIdentity.ISignUpResult
    > = (error, signUpResult) => {
        if (error) {
            userSignUpResponse = {
                statusCode: HttpStatusCode.BadRequest,
                body: JSON.stringify({
                    message: error.message,
                }),
            };
        }

        callbackComplete = true;
    };

    userPool.signUp(email, password, attributeList, [], callback);

    while (!callbackComplete) {
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 20);
        });
    }

    if (userSignUpResponse !== null) {
        return userSignUpResponse;
    }

    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify({
            message: "Got pretty far on this one right?",
        }),
    };
    // if they are successfully created, go ahead and create the company and the user in dynamo db
};
