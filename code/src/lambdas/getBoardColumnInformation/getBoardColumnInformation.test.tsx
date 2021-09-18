import {
    getBoardColumnInformation,
    getBoardColumnInformationInsufficentRights,
    getBoardColumnInformationCouldNotFindBoard,
} from ".";
import * as queryStringParametersErrorModule from "../../utils/queryStringParametersError";
import * as isCompanyUserModule from "../../utils/isCompanyUser";
import * as getItemFromPrimaryTableModule from "../../dynamo/primaryTable/getItem";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { IBoardColumnInformation } from "../../models/database/boardColumnInformation";
import { doneColumnReservedId } from "../../constants/reservedBoardColumnData";
import { IBoardColumn } from "../../models/database/boardColumn";

describe("getBoardColumnInformation", () => {
    describe("the queryStringParametersError function returned an error", () => {
        it("should return the error", async () => {
            jest.spyOn(
                queryStringParametersErrorModule,
                "queryStringParametersError"
            ).mockImplementation(() => {
                return "Error";
            });
            const response = await getBoardColumnInformation({} as any);
            expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
            const parsedResponse = JSON.parse(response.body);
            expect(parsedResponse.message).toBe("Error");
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

        describe("the user is not a company user", () => {
            it("should return the correct error", async () => {
                jest.spyOn(
                    isCompanyUserModule,
                    "isCompanyUser"
                ).mockImplementation(() => {
                    return Promise.resolve(false);
                });

                const response = await getBoardColumnInformation({
                    queryStringParameters: {
                        companyId: "123",
                        boardId: "456",
                    },
                } as any);
                expect(response.statusCode).toBe(HttpStatusCode.Forbidden);
                const parsedResponse = JSON.parse(response.body);
                expect(parsedResponse.message).toBe(
                    getBoardColumnInformationInsufficentRights
                );
            });
        });

        describe("the user is a company user", () => {
            beforeEach(() => {
                jest.spyOn(
                    isCompanyUserModule,
                    "isCompanyUser"
                ).mockImplementation(() => {
                    return Promise.resolve(true);
                });
            });

            describe("the boardColumnInformation returns null", () => {
                it("should return the correct error", async () => {
                    jest.spyOn(
                        getItemFromPrimaryTableModule,
                        "getItemFromPrimaryTable"
                    ).mockImplementation(() => {
                        return Promise.resolve(null);
                    });

                    const response = await getBoardColumnInformation({
                        queryStringParameters: {
                            companyId: "123",
                            boardId: "456",
                        },
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.BadRequest);
                    const parsedResponse = JSON.parse(response.body);
                    expect(parsedResponse.message).toBe(
                        getBoardColumnInformationCouldNotFindBoard
                    );
                });
            });

            describe("the boardColumnInformation returns the columns", () => {
                beforeEach(() => {
                    const boardColumnInformation: IBoardColumnInformation = {
                        itemId: "",
                        belongsTo: "",
                        columns: [
                            {
                                name: "To Do",
                                id: "1",
                                canBeModified: true,
                            },
                            {
                                name: "Done",
                                id: doneColumnReservedId,
                                canBeModified: false,
                            },
                        ],
                    };
                    jest.spyOn(
                        getItemFromPrimaryTableModule,
                        "getItemFromPrimaryTable"
                    ).mockImplementation(() => {
                        return Promise.resolve(boardColumnInformation);
                    });
                });

                it("should return a success response", async () => {
                    const response = await getBoardColumnInformation({
                        queryStringParameters: {
                            companyId: "123",
                            boardId: "456",
                        },
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.Ok);
                    const parsedResponse = JSON.parse(response.body);
                    expect(parsedResponse.columns).toBeTruthy();
                });

                it("should filter out the done column (legacy column)", async () => {
                    const response = await getBoardColumnInformation({
                        queryStringParameters: {
                            companyId: "123",
                            boardId: "456",
                        },
                    } as any);
                    expect(response.statusCode).toBe(HttpStatusCode.Ok);
                    const parsedResponse = JSON.parse(response.body) as {
                        columns: IBoardColumn[];
                    };
                    expect(parsedResponse.columns[0].name).toBe("To Do");
                    expect(parsedResponse.columns.length).toBe(1);
                });
            });
        });
    });
});
