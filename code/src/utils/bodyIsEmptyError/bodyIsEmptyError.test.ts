import { bodyIsEmptyError, bodyIsEmptyErrorMapping } from ".";
import { ICreateErrorResponse } from "../createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";

describe("bodyIsEmptyError", () => {
    describe("the body is falsy", () => {
        it("should return the correct error", () => {
            const response = bodyIsEmptyError(
                {} as any
            ) as ICreateErrorResponse;
            expect(response.statusCode).toBe(HttpStatusCode.BadRequest);

            const { message } = JSON.parse(response.body) as {
                message: string;
            };
            expect(message).toBe(bodyIsEmptyErrorMapping.noBodyOnRequest);
        });
    });

    describe("the body is truthy", () => {
        it("should return an empty string", () => {
            const response = bodyIsEmptyError({
                body: JSON.stringify(""),
            } as any);
            expect(response).toBe(false);
        });
    });
});
