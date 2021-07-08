import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { ITicketTemplate } from "./ticketTemplate";

export interface ITicket extends IDefaultPrimaryTableModel {
    title: string;
    summary: string;
    fields: {
        [id: string]: any;
    };
    createdTimestamp: string;
    lastModifiedTimestamp: string;
    completedTimestamp: string;
    tags: string[];
    ticketTemplate: ITicketTemplate;
}
