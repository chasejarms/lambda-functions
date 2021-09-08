import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { Section } from "./sections";

export interface ITicket extends IDefaultPrimaryTableModel {
    shortenedItemId: string;
    title: string;
    summary: string;
    sections: any[];
    ticketTemplateShortenedItemId: string;
    createdTimestamp: string;
    lastModifiedTimestamp: string;
    completedTimestamp: string;
    columnId: string;
    directAccessTicketId: string;
    assignedTo?:
        | ""
        | {
              userId: string;
              name: string;
          };
}
