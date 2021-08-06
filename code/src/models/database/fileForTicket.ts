import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";

export interface IFileForTicket extends IDefaultPrimaryTableModel {
    srcUrl: string;
    thumbnailUrl: string;
    size: number;
    fileName: string;
    isPngOrJpg: boolean;
}
