import { CloudFrontHeaders } from "aws-lambda";

export const contentSecurityPolicyAllowedDomains = [
    "https://mzfc9fiigj.execute-api.us-east-1.amazonaws.com",
    "https://ec366txftb.execute-api.us-east-1.amazonaws.com",
    "https://cognito-idp.us-east-1.amazonaws.com",
    "https://elastic-project-management-company-source-files.s3.us-east-1.amazonaws.com",
];

export function cloudFrontResponseHandlerBusinessLogic(
    headers: CloudFrontHeaders
) {
    //Set new headers
    headers["strict-transport-security"] = [
        {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubdomains; preload",
        },
    ];
    headers["content-security-policy"] = [
        {
            key: "Content-Security-Policy",
            value: `default-src 'self' ${contentSecurityPolicyAllowedDomains.join(
                " "
            )}; style-src 'self' 'unsafe-inline' https://*; font-src 'self' https://*;`,
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
}
