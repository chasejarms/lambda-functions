import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import * as AWS from "aws-sdk";

export const getCompaniesForUser = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const userSub = userSubFromEvent(event);
    if (userSub === "") {
        return {
            statusCode: HttpStatusCode.BadRequest,
            body: JSON.stringify({
                message: "Issue getting the user sub from the event",
            }),
        };
    }

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    dynamoClient.query({
        TableName: "primaryTableOne",
    });

    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify({
            message,
        }),
    };
};
