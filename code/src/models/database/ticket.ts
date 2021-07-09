import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { Section } from "./sections";

export interface ITicket extends IDefaultPrimaryTableModel {
    shortenedItemId: string;
    title: string;
    summary: string;
    sections: any[];
    createdTimestamp: string;
    lastModifiedTimestamp: string;
    completedTimestamp: string;
    tags: string[];
    simplifiedTicketTemplate: {
        title: {
            label: string;
        };
        summary: {
            isRequired: boolean;
            label: string;
        };
        sections: Section[];
    };
}
