import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";

export const getCompaniesForUser = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    return {
        statusCode: HttpStatusCode.Ok,
        body: JSON.stringify({
            message: "We got past the guards",
        }),
    };
};
