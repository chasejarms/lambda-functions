import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import * as AWS from "aws-sdk";
import { SES } from "aws-sdk";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export const capturePublicFormData = async (
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

    const ses = new AWS.SES();

    const sendEmailRequest: SES.Types.SendEmailRequest = {
        Source: "info@butterpm.com",
        Destination: {
            ToAddresses: ["info@butterpm.com"],
        },
        Message: {
            Subject: {
                Data: "Website Form Entry",
            },
            Body: {
                Text: {
                    Data: JSON.stringify(event.body),
                },
            },
        },
    };

    try {
        await ses.sendEmail(sendEmailRequest).promise();
    } catch (error) {
        const awsError = error as AWS.AWSError;

        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error sending the email"
        );
    }

    return createSuccessResponse({});
};
