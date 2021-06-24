import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface ICompanyUser extends IDefaultPrimaryTableModel {
    name: string;
    gsiSortKey: string;
    isCompanyAdmin: boolean;
}
