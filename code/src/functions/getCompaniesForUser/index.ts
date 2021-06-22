import { APIGatewayProxyEvent } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";

export const getCompaniesForUser = (event: APIGatewayProxyEvent) => {
    return {
        statusCode: HttpStatusCode.Ok,
        body: {
            message: "We got past the guards",
        },
    };
};
