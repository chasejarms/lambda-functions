import { CloudFrontResponseHandler } from "aws-lambda";
import { cloudFrontResponseHandlerBusinessLogic } from "./businessLogic";

export const cloudFrontResponseHandler: CloudFrontResponseHandler = (
    event,
    context,
    callback
) => {
    //Get contents of response
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    //Set new headers
    cloudFrontResponseHandlerBusinessLogic(headers);

    //Return modified response
    callback(null, response);
};
