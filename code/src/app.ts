import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "./models/httpStatusCode";

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

    const { companyName, username, password, name } = JSON.parse(event.body);

    if (!companyName || !username || !password || !name) {
        const requiredFieldsNotProvidedResponse = JSON.stringify({
            message:
                "companyName, username, name, and password are required fields",
        });

        return {
            statusCode: HttpStatusCode.BadRequest,
            body: requiredFieldsNotProvidedResponse,
        };
    }

    // check to see if the username and password already exist
    // if they don't exist, try creating them
    // if they are successfully created, go ahead and create the company and the user in dynamo db
};
