import { APIGatewayProxyEvent } from "aws-lambda";
import jwt_decode, { JwtPayload } from "jwt-decode";

export function userSubFromEvent(event: APIGatewayProxyEvent) {
    const authHeader = event.headers.authheader;

    if (!authHeader) {
        console.log("userSubFromEvent: auth header is not present on request");
        return "";
    }

    const decodedToken = jwt_decode(authHeader) as JwtPayload;
    if (!decodedToken.sub) {
        console.log("userSubFromEvent: subject is not present on token");
        return "";
    }

    return decodedToken.sub;
}
