import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface ITag extends IDefaultPrimaryTableModel {
    name: string;
    color: string;
}
