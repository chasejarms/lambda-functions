import { IBoardColumn } from "../models/database/boardColumn";
import { generateUniqueId } from "../utils/generateUniqueId";

export const reservedColumnIdStart = "INTERNAL";
export const uncategorizedColumnReservedId = `${reservedColumnIdStart}:UNCATEGORIZED`;
export const doneColumnReservedId = `${reservedColumnIdStart}:DONE`;

export const defaultUncategorizedColumn: IBoardColumn = {
    name: "Uncategorized",
    id: uncategorizedColumnReservedId,
    canBeModified: false,
};

export const defaultDoneColumn: IBoardColumn = {
    name: "Done",
    id: doneColumnReservedId,
    canBeModified: false,
};

export const defaultInProgressColumn: IBoardColumn = {
    name: "In Progress",
    id: generateUniqueId(1),
    canBeModified: true,
};
