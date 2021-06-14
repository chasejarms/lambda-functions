"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpNewUserHandler = void 0;
const httpStatusCode_1 = require("./models/httpStatusCode");
const AWSCognitoIdentity = require("amazon-cognito-identity-js");
const poolData = {
    UserPoolId: "us-east-1_etBRMChzv",
    ClientId: "espsfilvarkr44put09u8e17l", // Your client id here
};
const userPool = new AWSCognitoIdentity.CognitoUserPool(poolData);
/**
 * The purpose of this function is just to sign up new users (i.e. never have been added to the system). If
 * a user would like to create another company and already exists on a company, the user will need to
 * be authenticated so that we don't have to verify the passwords match.
 */
const signUpNewUserHandler = async (event) => {
    if (!event.body) {
        const noBodyResponse = JSON.stringify({
            message: "No Body On Request",
        });
        return {
            statusCode: httpStatusCode_1.HttpStatusCode.BadRequest,
            body: noBodyResponse,
        };
    }
    try {
        JSON.parse(event.body);
    }
    catch (_a) {
        const bodyMustBeAnObjectResponse = JSON.stringify({
            message: "Body must be an object",
        });
        return {
            statusCode: httpStatusCode_1.HttpStatusCode.BadRequest,
            body: bodyMustBeAnObjectResponse,
        };
    }
    const { companyName, email, password, name } = JSON.parse(event.body);
    if (!companyName || !email || !password || !name) {
        const requiredFieldsNotProvidedResponse = JSON.stringify({
            message: "companyName, email, name, and password are required fields",
        });
        return {
            statusCode: httpStatusCode_1.HttpStatusCode.BadRequest,
            body: requiredFieldsNotProvidedResponse,
        };
    }
    const attributeList = [];
    attributeList.push(new AWSCognitoIdentity.CognitoUserAttribute({
        Name: "name",
        Value: name,
    }));
    let userSignUpResponse = null;
    let signUpResultFromCallback;
    let callbackComplete = false;
    const callback = (error, signUpResult) => {
        if (error) {
            userSignUpResponse = {
                statusCode: httpStatusCode_1.HttpStatusCode.BadRequest,
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
        statusCode: httpStatusCode_1.HttpStatusCode.Ok,
        body: JSON.stringify({
            message: "Got pretty far on this one right?",
        }),
    };
    // if they are successfully created, go ahead and create the company and the user in dynamo db
};
exports.signUpNewUserHandler = signUpNewUserHandler;
//# sourceMappingURL=app.js.map