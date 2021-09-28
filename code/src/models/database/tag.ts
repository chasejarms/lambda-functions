import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { Color } from "./color";

export interface ITag extends IDefaultPrimaryTableModel {
    name: string;
    color: Color;
}
