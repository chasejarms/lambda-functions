import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { BoardPriorityType } from "./boardPriorityType";

export interface IBoard extends IDefaultPrimaryTableModel {
    name: string;
    description: string;
    hasBeenDeleted?: boolean;
    shortenedItemId: string;
    priorityType: BoardPriorityType;
}
