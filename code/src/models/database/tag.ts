import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { TagColor } from "./tagColor";

export interface ITag extends IDefaultPrimaryTableModel {
    name: string;
    color: TagColor;
}
