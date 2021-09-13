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
    name: "Archived",
    id: doneColumnReservedId,
    canBeModified: false,
};

export function generateDefaultColumns(): IBoardColumn[] {
    const toDo = {
        name: "To Do",
        id: generateUniqueId(4),
        canBeModified: true,
    };

    const doing = {
        name: "Doing",
        id: generateUniqueId(4),
        canBeModified: true,
    };

    const done = {
        name: "Done",
        id: generateUniqueId(4),
        canBeModified: true,
    };

    return [toDo, doing, done];
}
