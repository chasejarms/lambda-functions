import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface IBoardUser extends IDefaultPrimaryTableModel {
    isBoardAdmin: boolean;
}
