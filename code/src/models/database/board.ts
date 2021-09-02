import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface IBoard extends IDefaultPrimaryTableModel {
    name: string;
    description: string;
    hasBeenDeleted?: boolean;
    shortenedItemId: string;
}
