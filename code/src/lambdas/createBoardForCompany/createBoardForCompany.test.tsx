import * as bodyIsEmptyErrorModule from "../../utils/bodyIsEmptyError";
import * as bodyIsNotAnObjectErrorModule from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createBoardForCompany } from ".";
import { isEqual } from "lodash";

describe("createBoardForCompany", () => {
    describe("the bodyIsEmptyError function returned an error", () => {
        it("should return the correct error message", async () => {
            const errorResponse = createErrorResponse(
                HttpStatusCode.BadRequest,
                "Error"
            );
            jest.spyOn(
                bodyIsEmptyErrorModule,
                "bodyIsEmptyError"
            ).mockImplementation(() => {
                return errorResponse;
            });
            const response = await createBoardForCompany({} as any);
            expect(isEqual(errorResponse, response)).toBe(true);
        });
    });

    describe("the bodyIsEmptyError function returned false", () => {
        beforeEach(() => {
            jest.spyOn(
                bodyIsEmptyErrorModule,
                "bodyIsEmptyError"
            ).mockImplementation(() => {
                return false;
            });
        });

        describe("the bodyIsNotAnObjectError function returned an error", () => {
            it("should return the correct error response", async () => {
                const errorResponse = createErrorResponse(
                    HttpStatusCode.BadRequest,
                    "Error"
                );
                jest.spyOn(
                    bodyIsNotAnObjectErrorModule,
                    "bodyIsNotAnObjectError"
                ).mockImplementation(() => {
                    return errorResponse;
                });
                const response = await createBoardForCompany({} as any);
                expect(isEqual(errorResponse, response)).toBe(true);
            });
        });
    });
});
