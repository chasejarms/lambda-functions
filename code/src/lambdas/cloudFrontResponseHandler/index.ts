import { CloudFrontResponseHandler } from "aws-lambda";

export const cloudFrontResponseHandler: CloudFrontResponseHandler = (
    event,
    context,
    callback
) => {
    //Get contents of response
    const response = event.Records[0].cf.response;
    const headers = response.headers;

    //Set new headers
    headers["strict-transport-security"] = [
        {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubdomains; preload",
        },
    ];
    // TODO: Investigate adding this back in later
    headers["content-security-policy"] = [
        {
            key: "Content-Security-Policy",
            value:
                "default-src 'self'; style-src 'self' 'unsafe-inline' https://*; font-src 'self' https://*; connect-src https://b2ouopcfb7.execute-api.us-east-1.amazonaws.com https://tnj4vxar72.execute-api.us-east-1.amazonaws.com;",
        },
    ];
    headers["x-xss-protection"] = [
        { key: "X-XSS-Protection", value: "1; mode=block" },
    ];
    headers["x-content-type-options"] = [
        { key: "X-Content-Type-Options", value: "nosniff" },
    ];
    headers["x-frame-options"] = [{ key: "X-Frame-Options", value: "DENY" }];

    headers["referrer-policy"] = [
        { key: "Referrer-Policy", value: "same-origin" },
    ];

    //Return modified response
    callback(null, response);
};
