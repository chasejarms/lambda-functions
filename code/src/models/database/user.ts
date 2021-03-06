import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface IUser extends IDefaultPrimaryTableModel {
    name: string;
    gsiSortKey: string;
    canManageCompanyUsers: boolean;
    email: string;
    isRootUser: boolean;
    boardRights: {
        [boardId: string]: {
            isAdmin: boolean;
        };
    };
    shortenedItemId: string;
}
