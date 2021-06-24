import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface ICompanyUser extends IDefaultPrimaryTableModel {
    Name: string;
    GSISortKey: string;
    isCompanyAdmin: boolean;
}
