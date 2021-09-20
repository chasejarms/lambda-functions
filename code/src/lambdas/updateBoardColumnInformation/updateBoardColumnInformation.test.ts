import * as bodyIsEmptyErrorModule from "../../utils/bodyIsEmptyError";
import * as bodyIsNotAnObjectErrorModule from "../../utils/bodyIsNotAnObjectError";
import * as queryStringParametersErrorModule from "../../utils/queryStringParametersError";
import * as isBoardAdminModule from "../../utils/isBoardAdmin";
import * as columnDataErrorMessageModule from "../../dataValidation/columnDataErrorMessage";
import * as overrideItemInPrimaryTableModule from "../../dynamo/primaryTable/overrideItem";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import {
    updateBoardColumnInformation,
    updateBoardColumnInformationErrors,
} from ".";
import { isEqual } from "lodash";
import { IBoardColumnRequest } from "../../models/requests/boardColumnRequest";

describe("updateBoardColumnInformation", () => {
    describe("the bodyIsEmptyError function returned an error", () => {
        it("should return the correct error response", async () => {
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
            const response = await updateBoardColumnInformation({} as any);
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
                const response = await updateBoardColumnInformation({} as any);
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

            describe("the queryStringParametersError function returned an error", () => {
                it("should return the correct error", async () => {
                    jest.spyOn(
                        queryStringParametersErrorModule,
                        "queryStringParametersError"
                    ).mockImplementation(() => {
                        return "Error";
                    });

                    const response = await updateBoardColumnInformation(
                        {} as any
                    );
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const parsedBody = JSON.parse(response.body) as {
                        message: string;
                    };
                    expect(parsedBody.message).toBe("Error");
                });
            });

            describe("the queryStringParametersError function returned an empty string", () => {
                beforeEach(() => {
                    jest.spyOn(
                        queryStringParametersErrorModule,
                        "queryStringParametersError"
                    ).mockImplementation(() => {
                        return "";
                    });
                });

                describe("the columns are not provided on the request body", () => {
                    it("should return the correct error", async () => {
                        const response = await updateBoardColumnInformation({
                            queryStringParameters: {
                                boardId: "123",
                                companyId: "456",
                            },
                            body: JSON.stringify({}),
                        } as any);
                        expect(response.statusCode).toBe(
                            HttpStatusCode.BadRequest
                        );
                        const parsedBody = JSON.parse(response.body) as {
                            message: string;
                        };
                        expect(parsedBody.message).toBe(
                            updateBoardColumnInformationErrors.columnsRequiredOnRequestBody
                        );
                    });
                });

                describe("the user is NOT a board admin", () => {
                    it("should return the correct error", async () => {
                        jest.spyOn(
                            isBoardAdminModule,
                            "isBoardAdmin"
                        ).mockImplementation(() => {
                            return Promise.resolve(false);
                        });

                        const response = await updateBoardColumnInformation({
                            queryStringParameters: {
                                boardId: "123",
                                companyId: "456",
                            },
                            body: JSON.stringify({
                                columns: [],
                            }),
                        } as any);
                        expect(response.statusCode).toBe(
                            HttpStatusCode.Forbidden
                        );
                        const parsedBody = JSON.parse(response.body) as {
                            message: string;
                        };
                        expect(parsedBody.message).toBe(
                            updateBoardColumnInformationErrors.insufficientPermissions
                        );
                    });
                });

                describe("the user is a board admin", () => {
                    beforeEach(() => {
                        jest.spyOn(
                            isBoardAdminModule,
                            "isBoardAdmin"
                        ).mockImplementation(() => {
                            return Promise.resolve(true);
                        });
                    });

                    describe("the columnDataErrorMessage retured an error", () => {
                        it("should return the correct error message", async () => {
                            jest.spyOn(
                                columnDataErrorMessageModule,
                                "columnDataErrorMessage"
                            ).mockImplementation(() => {
                                return "Column Data Error" as any;
                            });

                            const response = await updateBoardColumnInformation(
                                {
                                    queryStringParameters: {
                                        boardId: "123",
                                        companyId: "456",
                                    },
                                    body: JSON.stringify({
                                        columns: [],
                                    }),
                                } as any
                            );
                            expect(response.statusCode).toBe(
                                HttpStatusCode.BadRequest
                            );
                            const parsedBody = JSON.parse(response.body) as {
                                message: string;
                            };
                            expect(parsedBody.message).toBe(
                                "Column Data Error"
                            );
                        });
                    });

                    describe("columnDataErrorMessage retured an empty string", () => {
                        beforeEach(() => {
                            jest.spyOn(
                                columnDataErrorMessageModule,
                                "columnDataErrorMessage"
                            ).mockImplementation(() => {
                                return "" as any;
                            });
                        });

                        describe("overrideItemInPrimaryTable returned a falsy response", () => {
                            it("should return the correct error", async () => {
                                jest.spyOn(
                                    overrideItemInPrimaryTableModule,
                                    "overrideItemInPrimaryTable"
                                ).mockImplementation(() => {
                                    return Promise.resolve(null);
                                });

                                const response = await updateBoardColumnInformation(
                                    {
                                        queryStringParameters: {
                                            boardId: "123",
                                            companyId: "456",
                                        },
                                        body: JSON.stringify({
                                            columns: [],
                                        }),
                                    } as any
                                );
                                expect(response.statusCode).toBe(
                                    HttpStatusCode.BadRequest
                                );
                                const parsedBody = JSON.parse(
                                    response.body
                                ) as {
                                    message: string;
                                };
                                expect(parsedBody.message).toBe(
                                    updateBoardColumnInformationErrors.dynamoError
                                );
                            });
                        });

                        describe("overrideItemInPrimaryTable returned a truthy response", () => {
                            it("should return the columns back to the client", async () => {
                                jest.spyOn(
                                    overrideItemInPrimaryTableModule,
                                    "overrideItemInPrimaryTable"
                                ).mockImplementation(() => {
                                    return Promise.resolve(true);
                                });

                                const columns: IBoardColumnRequest[] = [
                                    {
                                        name: "To Do",
                                        id: "1",
                                        canBeModified: false,
                                    },
                                ];
                                const response = await updateBoardColumnInformation(
                                    {
                                        queryStringParameters: {
                                            boardId: "123",
                                            companyId: "456",
                                        },
                                        body: JSON.stringify({
                                            columns,
                                        }),
                                    } as any
                                );
                                expect(response.statusCode).toBe(
                                    HttpStatusCode.Ok
                                );
                                const parsedBody = JSON.parse(
                                    response.body
                                ) as {
                                    columns: IBoardColumnRequest[];
                                };
                                expect(
                                    isEqual(parsedBody.columns, columns)
                                ).toBe(true);
                            });
                        });
                    });
                });
            });
        });
    });
});
