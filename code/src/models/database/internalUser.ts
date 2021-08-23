import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface IInternalUser extends IDefaultPrimaryTableModel {
    name: string;
    email: string;
    shortenedItemId: string;
    canModifyLearningVideos: boolean;
}
