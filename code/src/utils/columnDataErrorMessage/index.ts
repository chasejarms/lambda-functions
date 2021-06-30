import { IBoardColumnRequest } from "../../models/requests/boardColumnRequest";
import { IBoardColumn } from "../../models/database/boardColumn";
import { isEqual } from "lodash";

const reservedColumnIdStart = "INTERNAL";
const uncategorizedColumnReservedId = `${reservedColumnIdStart}:UNCATEGORIZED`;
const doneColumnReservedId = `${reservedColumnIdStart}:DONE`;

const defaultUncategorizedColumn: IBoardColumn = {
    name: "Uncategorized",
    id: uncategorizedColumnReservedId,
    canBeModified: false,
};

const defaultDoneColumn: IBoardColumn = {
    name: "Done",
    id: doneColumnReservedId,
    canBeModified: false,
};

export function columnDataErrorMessage(columns: IBoardColumnRequest[]) {
    if (columns.length === 2) {
        return "Must have at least one custom column";
    }

    const uncategorizedColumn = columns[0];
    const doneColumn = columns[columns.length - 1];
    const otherColumns = columns.slice(1, columns.length - 1);

    if (!isEqual(uncategorizedColumn, defaultUncategorizedColumn)) {
        return "The uncategorized column cannot be changed";
    }

    if (!isEqual(doneColumn, defaultDoneColumn)) {
        return "The done column cannot be changed";
    }

    const otherColumnsAreInvalid = otherColumns.some((column) => {
        const columnIdUsesReservedWord = column.id
            ? column.id.startsWith(reservedColumnIdStart)
            : false;
        return columnIdUsesReservedWord || !column.canBeModified;
    });

    if (otherColumnsAreInvalid) {
        return "Added column eithers starts with INTERNAL for the id or has had its modified property updated to be false.";
    }

    return "";
}
