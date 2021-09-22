import { getBoardsForCompany, getBoardsForCompanyErrors } from ".";
import * as isCompanyUserModule from "../../utils/isCompanyUser";
import * as queryParentToChildIndexBeginsWithModule from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { IBoard } from "../../models/database/board";

describe("getBoardsForCompany", () => {
    describe("the companyId query string is not provided", () => {
        it("should return the correct error", async () => {
            const result = await getBoardsForCompany({
                queryStringParameters: {},
            } as any);
            expect(result.statusCode).toBe(HttpStatusCode.BadRequest);
            const parsedBody = JSON.parse(result.body) as {
                message: string;
            };
            expect(parsedBody.message.includes("companyId")).toBe(true);
        });
    });

    describe("the isCompanyUser function returns false", () => {
        it("should return the correct error", async () => {
            jest.spyOn(isCompanyUserModule, "isCompanyUser").mockImplementation(
                () => {
                    return Promise.resolve(false);
                }
            );

            const result = await getBoardsForCompany({
                queryStringParameters: {
                    companyId: "123",
                },
            } as any);
            expect(result.statusCode).toBe(HttpStatusCode.Forbidden);
            const parsedBody = JSON.parse(result.body) as {
                message: string;
            };
            expect(parsedBody.message).toBe(
                getBoardsForCompanyErrors.insufficientRights
            );
        });
    });

    describe("the isCompanyUser function returns true", () => {
        beforeEach(() => {
            jest.spyOn(isCompanyUserModule, "isCompanyUser").mockImplementation(
                () => {
                    return Promise.resolve(true);
                }
            );
        });

        describe("the queryParentToChildIndexBeginsWith function returns null", () => {
            it("should show the correct error message", async () => {
                jest.spyOn(
                    queryParentToChildIndexBeginsWithModule,
                    "queryParentToChildIndexBeginsWith"
                ).mockImplementation(() => {
                    return Promise.resolve(null);
                });

                const result = await getBoardsForCompany({
                    queryStringParameters: {
                        companyId: "123",
                    },
                } as any);
                expect(result.statusCode).toBe(HttpStatusCode.BadRequest);
                const parsedBody = JSON.parse(result.body) as {
                    message: string;
                };
                expect(parsedBody.message).toBe(
                    getBoardsForCompanyErrors.dynamoError
                );
            });
        });

        describe("the queryParentToChildIndexBeginsWith function returns the board data", () => {
            it("should only return the boards that have not been deleted", async () => {
                jest.spyOn(
                    queryParentToChildIndexBeginsWithModule,
                    "queryParentToChildIndexBeginsWith"
                ).mockImplementation(() => {
                    const boards: IBoard[] = [
                        {
                            itemId: "1",
                            belongsTo: "",
                            name: "Non-Deleted Board",
                            description: "",
                            shortenedItemId: "",
                        },
                        {
                            itemId: "2",
                            belongsTo: "",
                            name: "Deleted Board",
                            description: "",
                            shortenedItemId: "",
                            hasBeenDeleted: true,
                        },
                    ];
                    return Promise.resolve(boards);
                });

                const result = await getBoardsForCompany({
                    queryStringParameters: {
                        companyId: "123",
                    },
                } as any);
                expect(result.statusCode).toBe(HttpStatusCode.Ok);
                const parsedBody = JSON.parse(result.body) as {
                    items: IBoard[];
                };
                expect(parsedBody.items.length).toBe(1);
                expect(parsedBody.items[0].name).toBe("Non-Deleted Board");
            });
        });
    });
});
