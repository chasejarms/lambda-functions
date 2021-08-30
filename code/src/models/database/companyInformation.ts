import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface ICompanyInformation extends IDefaultPrimaryTableModel {
    created: string;
    name: string;
    shortenedItemId: string;
}
