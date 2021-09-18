import { IBoardColumnRequest } from "../../models/requests/boardColumnRequest";
import { isEqual } from "lodash";
import {
    defaultUncategorizedColumn,
    reservedColumnIdStart,
} from "../../constants/reservedBoardColumnData";

export const columnDataErrorMessageLessThanTwoColumns =
    "Must have at least one custom column";
export const columnDataErrorMessageUncategorizedColumnChanged =
    "The uncategorized column cannot be changed";
export const columnDataErrorMessageOtherColumnsAreInvalid =
    "Added column eithers starts with INTERNAL for the id or has had its modified property updated to be false.";
export const columnDataErrorMessageColumnsMustHaveId =
    "All columns must have an id";
export const columnDataErrorMessageDuplicateIds =
    "Each column must have a unique id";

export function columnDataErrorMessage(columns: IBoardColumnRequest[]) {
    if (columns.length < 2) {
        return columnDataErrorMessageLessThanTwoColumns;
    }

    const uncategorizedColumn = columns[0];
    const otherColumns = columns.slice(1);

    if (!isEqual(uncategorizedColumn, defaultUncategorizedColumn)) {
        return columnDataErrorMessageUncategorizedColumnChanged;
    }

    const otherColumnsAreInvalid = otherColumns.some((column) => {
        const columnIdUsesReservedWord = column.id
            ? column.id.startsWith(reservedColumnIdStart)
            : false;
        return columnIdUsesReservedWord || !column.canBeModified;
    });

    if (otherColumnsAreInvalid) {
        return columnDataErrorMessageOtherColumnsAreInvalid;
    }

    const allColumnsHaveId = columns.every((column) => {
        return !!column.id;
    });

    if (!allColumnsHaveId) {
        return columnDataErrorMessageColumnsMustHaveId;
    }

    const idsMapping: {
        [id: string]: boolean;
    } = {};

    for (let i = 0; i < columns.length; i++) {
        const { id } = columns[i];
        const idAlreadyExists = !!idsMapping[id];
        if (idAlreadyExists) {
            return columnDataErrorMessageDuplicateIds;
        }
        idsMapping[id] = true;
    }

    return "";
}
