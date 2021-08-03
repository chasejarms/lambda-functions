import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface ICompanyInformation extends IDefaultPrimaryTableModel {
    name: string;
    shortenedItemId: string;
}
