import {
    columnDataErrorMessage,
    columnDataErrorMessageLessThanTwoColumns,
    columnDataErrorMessageUncategorizedColumnChanged,
    columnDataErrorMessageOtherColumnsAreInvalid,
    columnDataErrorMessageColumnsMustHaveId,
    columnDataErrorMessageDuplicateIds,
} from ".";
import {
    defaultUncategorizedColumn,
    reservedColumnIdStart,
} from "../../constants/reservedBoardColumnData";
import { cloneDeep } from "lodash";

describe("columnDataErrorMessage", () => {
    describe("the column length is less than two", () => {
        it("should return the correct error message", () => {
            const error = columnDataErrorMessage([
                cloneDeep(defaultUncategorizedColumn),
            ]);
            expect(error).toBe(columnDataErrorMessageLessThanTwoColumns);
        });
    });

    describe("the uncategorized column has changed", () => {
        it("should return the correct error message", () => {
            const uncategorizedColumn = cloneDeep(defaultUncategorizedColumn);
            uncategorizedColumn.canBeModified = true;
            const error = columnDataErrorMessage([
                uncategorizedColumn,
                {
                    name: "To Do",
                    id: "1",
                    canBeModified: true,
                },
            ]);
            expect(error).toBe(
                columnDataErrorMessageUncategorizedColumnChanged
            );
        });
    });

    describe("a column id starts with a reserved word", () => {
        it("should return the correct error message", () => {
            const uncategorizedColumn = cloneDeep(defaultUncategorizedColumn);
            const error = columnDataErrorMessage([
                uncategorizedColumn,
                {
                    name: "To Do",
                    id: `${reservedColumnIdStart}:To-Do`,
                    canBeModified: true,
                },
            ]);
            expect(error).toBe(columnDataErrorMessageOtherColumnsAreInvalid);
        });
    });

    describe("a column has canModified set to false", () => {
        it("should return the correct error message", () => {
            const uncategorizedColumn = cloneDeep(defaultUncategorizedColumn);
            const error = columnDataErrorMessage([
                uncategorizedColumn,
                {
                    name: "To Do",
                    id: "1",
                    canBeModified: false,
                },
            ]);
            expect(error).toBe(columnDataErrorMessageOtherColumnsAreInvalid);
        });
    });

    describe("a column is missing an id", () => {
        it("should return the correct error message", () => {
            const uncategorizedColumn = cloneDeep(defaultUncategorizedColumn);
            const error = columnDataErrorMessage([
                uncategorizedColumn,
                {
                    name: "To Do",
                    id: "",
                    canBeModified: true,
                },
            ]);
            expect(error).toBe(columnDataErrorMessageColumnsMustHaveId);
        });
    });

    describe("two columns share the same id", () => {
        it("should return the correct error message", () => {
            const uncategorizedColumn = cloneDeep(defaultUncategorizedColumn);
            const error = columnDataErrorMessage([
                uncategorizedColumn,
                {
                    name: "To Do",
                    id: "1",
                    canBeModified: true,
                },
                {
                    name: "In Progress",
                    id: "1",
                    canBeModified: true,
                },
            ]);
            expect(error).toBe(columnDataErrorMessageDuplicateIds);
        });
    });

    describe("the request passes all of the checks", () => {
        it("should return an empty string", () => {
            const uncategorizedColumn = cloneDeep(defaultUncategorizedColumn);
            const error = columnDataErrorMessage([
                uncategorizedColumn,
                {
                    name: "To Do",
                    id: "1",
                    canBeModified: true,
                },
            ]);
            expect(error).toBe("");
        });
    });
});
