import { bodyIsNotAnObjectError, bodyIsNotAnObjectErrorMapping } from ".";
import { ICreateErrorResponse } from "../createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";

describe("bodyIsNotAnObjectError", () => {
    describe("the body is NOT an object", () => {
        it("should return the correct error response", () => {
            const response = bodyIsNotAnObjectError({
                body: "",
            } as any) as ICreateErrorResponse;
            expect(response.statusCode).toBe(HttpStatusCode.BadRequest);

            const { message } = JSON.parse(response.body) as {
                message: string;
            };
            expect(message).toBe(bodyIsNotAnObjectErrorMapping.mustBeAnObject);
        });
    });

    describe("the body is an object", () => {
        it("should return false", () => {
            const response = bodyIsNotAnObjectError({
                body: JSON.stringify({}),
            } as any);
            expect(response).toBe(false);
        });
    });
});
