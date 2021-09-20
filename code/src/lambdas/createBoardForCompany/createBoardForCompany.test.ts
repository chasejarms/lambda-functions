import * as bodyIsEmptyErrorModule from "../../utils/bodyIsEmptyError";
import * as bodyIsNotAnObjectErrorModule from "../../utils/bodyIsNotAnObjectError";
import * as getUserModule from "../../utils/getUser";
import * as tryTransactWriteThreeTimesInPrimaryTableModule from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createBoardForCompany, createBoardForCompanyErrors } from ".";
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

        describe("the bodyIsNotAnObjectError function returned false", () => {
            beforeEach(() => {
                jest.spyOn(
                    bodyIsNotAnObjectErrorModule,
                    "bodyIsNotAnObjectError"
                ).mockImplementation(() => {
                    return false;
                });
            });

            describe("the companyId is not present on the request body", () => {
                it("should return the correct error message", async () => {
                    const response = await createBoardForCompany({
                        body: JSON.stringify({}),
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const { message } = JSON.parse(response.body) as {
                        message: string;
                    };
                    expect(message).toBe(
                        createBoardForCompanyErrors.companyIdIsRequired
                    );
                });
            });

            describe("the boardName is not present on the request body", () => {
                it("should return the correct error message", async () => {
                    const response = await createBoardForCompany({
                        body: JSON.stringify({
                            companyId: "123",
                        }),
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const { message } = JSON.parse(response.body) as {
                        message: string;
                    };
                    expect(message).toBe(
                        createBoardForCompanyErrors.boardNameIsRequired
                    );
                });
            });

            describe("the boardDescription is not present on the request body", () => {
                it("should return the correct error message", async () => {
                    const response = await createBoardForCompany({
                        body: JSON.stringify({
                            companyId: "123",
                            boardName: "Development Board",
                        }),
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const { message } = JSON.parse(response.body) as {
                        message: string;
                    };
                    expect(message).toBe(
                        createBoardForCompanyErrors.boardDescriptionIsRequired
                    );
                });
            });

            describe("the user is NOT a company user", () => {
                it("should return the correct error message", async () => {
                    jest.spyOn(getUserModule, "getUser").mockImplementation(
                        () => {
                            return Promise.resolve(null);
                        }
                    );

                    const response = await createBoardForCompany({
                        body: JSON.stringify({
                            companyId: "123",
                            boardName: "Development Board",
                            boardDescription: "Some Description",
                        }),
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const { message } = JSON.parse(response.body) as {
                        message: string;
                    };
                    expect(message).toBe(
                        createBoardForCompanyErrors.insufficientRights
                    );
                });
            });

            describe("the user is a company user", () => {
                beforeEach(() => {
                    jest.spyOn(getUserModule, "getUser").mockImplementation(
                        () => {
                            return Promise.resolve({
                                name: "Me",
                                gsiSortKey: "me",
                                canManageCompanyUsers: false,
                                email: "me@me.com",
                                isRootUser: true,
                                boardRights: {},
                                shortenedItemId: "",
                                itemId: "",
                                belongsTo: "",
                            });
                        }
                    );
                });

                describe("the tryTransactWriteThreeTimesInPrimaryTable returns a falsy response", () => {
                    it("should return the correct error message", async () => {
                        jest.spyOn(
                            tryTransactWriteThreeTimesInPrimaryTableModule,
                            "tryTransactWriteThreeTimesInPrimaryTable"
                        ).mockImplementation(() => {
                            return Promise.resolve(false);
                        });

                        const response = await createBoardForCompany({
                            body: JSON.stringify({
                                companyId: "123",
                                boardName: "Development Board",
                                boardDescription: "Some Description",
                            }),
                        } as any);
                        expect(response.statusCode).toBe(
                            HttpStatusCode.BadRequest
                        );
                        const { message } = JSON.parse(response.body) as {
                            message: string;
                        };
                        expect(message).toBe(
                            createBoardForCompanyErrors.dynamoError
                        );
                    });
                });

                describe("the tryTransactWriteThreeTimesInPrimaryTable returns a truthy response", () => {
                    it("should return the correct data in the response", async () => {
                        jest.spyOn(
                            tryTransactWriteThreeTimesInPrimaryTableModule,
                            "tryTransactWriteThreeTimesInPrimaryTable"
                        ).mockImplementation(() => {
                            return Promise.resolve(true);
                        });

                        const boardName = "Development Board";
                        const boardDescription = "Some Description";
                        const response = await createBoardForCompany({
                            body: JSON.stringify({
                                companyId: "123",
                                boardName,
                                boardDescription,
                            }),
                        } as any);
                        expect(response.statusCode).toBe(HttpStatusCode.Ok);
                        const { id, name, description } = JSON.parse(
                            response.body
                        ) as {
                            id: string;
                            name: string;
                            description: string;
                        };
                        expect(id).toBe("");
                        expect(name).toBe(boardName);
                        expect(description).toBe(boardDescription);
                    });
                });
            });
        });
    });
});
