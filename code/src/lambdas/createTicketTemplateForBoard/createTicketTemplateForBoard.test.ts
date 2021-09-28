import {
    createTicketTemplateForBoard,
    createTicketTemplateForBoardErrors,
} from ".";
import * as bodyIsEmptyErrorModule from "../../utils/bodyIsEmptyError";
import * as bodyIsNotAnObjectErrorModule from "../../utils/bodyIsNotAnObjectError";
import * as queryStringParametersErrorModule from "../../utils/queryStringParametersError";
import * as ticketTemplateCreateRequestErrorMessageModule from "../../dataValidation/ticketTemplateCreateRequestErrorMessage";
import * as isBoardAdminModule from "../../utils/isBoardAdmin";
import * as tryTransactWriteThreeTimesInPrimaryTableModule from "../../dynamo/primaryTable/tryTransactWriteThreeTimes";

import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";

describe("createTicketTemplateForBoard", () => {
    describe("the bodyIsEmptyErrorResponse message returns an error", () => {
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

            const response = await createTicketTemplateForBoard({} as any);
            expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
            const parsedBody = JSON.parse(response.body) as {
                message: string;
            };
            expect(parsedBody.message).toBe("Error");
        });
    });

    describe("the bodyIsEmptyErrorMessage returns false", () => {
        beforeEach(() => {
            jest.spyOn(
                bodyIsEmptyErrorModule,
                "bodyIsEmptyError"
            ).mockImplementation(() => {
                return false;
            });
        });

        describe("the bodyIsNotAnObjectError returns an error", () => {
            it("should return the correct error response", async () => {
                const errorResponse = createErrorResponse(
                    HttpStatusCode.BadRequest,
                    "Not An Object"
                );
                jest.spyOn(
                    bodyIsNotAnObjectErrorModule,
                    "bodyIsNotAnObjectError"
                ).mockImplementation(() => {
                    return errorResponse;
                });

                const response = await createTicketTemplateForBoard({
                    body: "",
                } as any);
                expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                const parsedBody = JSON.parse(response.body) as {
                    message: string;
                };
                expect(parsedBody.message).toBe("Not An Object");
            });
        });

        describe("the bodyIsNotAnObjectError returns false", () => {
            beforeEach(() => {
                jest.spyOn(
                    bodyIsNotAnObjectErrorModule,
                    "bodyIsNotAnObjectError"
                ).mockImplementation(() => {
                    return false;
                });
            });

            describe("the queryStringParametersError returns an error", () => {
                it("should return the correct error response", async () => {
                    jest.spyOn(
                        queryStringParametersErrorModule,
                        "queryStringParametersError"
                    ).mockImplementation(() => {
                        return "Query String Error";
                    });

                    const response = await createTicketTemplateForBoard({
                        body: "",
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const parsedBody = JSON.parse(response.body) as {
                        message: string;
                    };
                    expect(parsedBody.message).toBe("Query String Error");
                });
            });

            describe("the queryStringParametersError returns an empty string", () => {
                beforeEach(() => {
                    jest.spyOn(
                        queryStringParametersErrorModule,
                        "queryStringParametersError"
                    ).mockImplementation(() => {
                        return "";
                    });
                });

                describe("the ticket template is not provided on the body", () => {
                    it("should return the correct error message", async () => {
                        const response = await createTicketTemplateForBoard({
                            body: JSON.stringify({}),
                            queryStringParameters: {
                                companyId: "1",
                                boardId: "2",
                            },
                        } as any);
                        expect(response.statusCode).toBe(
                            HttpStatusCode.BadRequest
                        );
                        const parsedBody = JSON.parse(response.body) as {
                            message: string;
                        };
                        expect(parsedBody.message).toBe(
                            createTicketTemplateForBoardErrors.ticketTemplateIsRequiredField
                        );
                    });
                });

                describe("the ticketTemplateCreateRequestErrorMessage returns an error", () => {
                    it("should return the correct error response", async () => {
                        jest.spyOn(
                            ticketTemplateCreateRequestErrorMessageModule,
                            "ticketTemplateCreateRequestErrorMessage"
                        ).mockImplementation(() => {
                            return "Schema Error";
                        });

                        const response = await createTicketTemplateForBoard({
                            body: JSON.stringify({
                                ticketTemplate: {},
                            }),
                            queryStringParameters: {
                                companyId: "1",
                                boardId: "2",
                            },
                        } as any);
                        expect(response.statusCode).toBe(
                            HttpStatusCode.BadRequest
                        );
                        const parsedBody = JSON.parse(response.body) as {
                            message: string;
                        };
                        expect(parsedBody.message).toBe("Schema Error");
                    });
                });

                describe("the ticketTemplateCreateRequestErrorMessage returns an empty string", () => {
                    beforeEach(() => {
                        jest.spyOn(
                            ticketTemplateCreateRequestErrorMessageModule,
                            "ticketTemplateCreateRequestErrorMessage"
                        ).mockImplementation(() => {
                            return "";
                        });
                    });

                    describe("the isBoardAdmin returns false", () => {
                        it("should return the correct error response", async () => {
                            jest.spyOn(
                                isBoardAdminModule,
                                "isBoardAdmin"
                            ).mockImplementation(() => {
                                return Promise.resolve(false);
                            });

                            const response = await createTicketTemplateForBoard(
                                {
                                    body: JSON.stringify({
                                        ticketTemplate: {},
                                    }),
                                    queryStringParameters: {
                                        companyId: "1",
                                        boardId: "2",
                                    },
                                } as any
                            );
                            expect(response.statusCode).toBe(
                                HttpStatusCode.Forbidden
                            );
                            const parsedBody = JSON.parse(response.body) as {
                                message: string;
                            };
                            expect(parsedBody.message).toBe(
                                createTicketTemplateForBoardErrors.insufficientRights
                            );
                        });
                    });

                    describe("the isBoardAdmin returns true", () => {
                        beforeEach(() => {
                            jest.spyOn(
                                isBoardAdminModule,
                                "isBoardAdmin"
                            ).mockImplementation(() => {
                                return Promise.resolve(true);
                            });
                        });

                        describe("the tryTransactWriteThreeTimesInPrimaryTable returns null", () => {
                            it("should return the correct error response", async () => {
                                jest.spyOn(
                                    tryTransactWriteThreeTimesInPrimaryTableModule,
                                    "tryTransactWriteThreeTimesInPrimaryTable"
                                ).mockImplementation(() => {
                                    return Promise.resolve(null);
                                });

                                const response = await createTicketTemplateForBoard(
                                    {
                                        body: JSON.stringify({
                                            ticketTemplate: {},
                                        }),
                                        queryStringParameters: {
                                            companyId: "1",
                                            boardId: "2",
                                        },
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
                                    createTicketTemplateForBoardErrors.errorCreatingTemplate
                                );
                            });
                        });

                        describe("the tryTransactWriteThreeTimesInPrimaryTable returns a truthy value", () => {
                            it("should return the success response", async () => {
                                jest.spyOn(
                                    tryTransactWriteThreeTimesInPrimaryTableModule,
                                    "tryTransactWriteThreeTimesInPrimaryTable"
                                ).mockImplementation(() => {
                                    return Promise.resolve(true);
                                });

                                const response = await createTicketTemplateForBoard(
                                    {
                                        body: JSON.stringify({
                                            ticketTemplate: {},
                                        }),
                                        queryStringParameters: {
                                            companyId: "1",
                                            boardId: "2",
                                        },
                                    } as any
                                );
                                expect(response.statusCode).toBe(
                                    HttpStatusCode.Ok
                                );
                            });
                        });
                    });
                });
            });
        });
    });
});
