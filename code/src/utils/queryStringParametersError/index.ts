import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda";

export function queryStringParametersError(
    queryStringParameters: APIGatewayProxyEventQueryStringParameters,
    ...requiredQueryStrings: string[]
) {
    const errorMessage = `This request requires the following query strings: ${requiredQueryStrings.join(
        " "
    )}`;
    if (!queryStringParameters) return errorMessage;

    for (let i = 0; i < requiredQueryStrings.length; i++) {
        const requiredQueryString = requiredQueryStrings[i];
        if (!queryStringParameters[requiredQueryString]) {
            return errorMessage;
        }
    }

    return "";
}
