import { IBoardColumn } from "./boardColumn";
import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface IBoardColumnInformation extends IDefaultPrimaryTableModel {
    columns: IBoardColumn[];
}
