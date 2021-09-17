import {
    cloudFrontResponseHandlerBusinessLogic,
    contentSecurityPolicyAllowedDomains,
} from ".";

describe("cloudFrontResponseHandler", () => {
    it("should add all the allowed domains into the content security policy", () => {
        const headers = {} as any;
        cloudFrontResponseHandlerBusinessLogic(headers);
        contentSecurityPolicyAllowedDomains.forEach((allowedDomain) => {
            expect(
                headers["content-security-policy"][0].value.includes(
                    allowedDomain
                )
            );
        });
    });
});
