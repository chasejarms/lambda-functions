import { ITicketTemplate } from "../database/ticketTemplate";
import { Section } from "../database/sections";

export interface ITicketCreateRequest {
    title: string;
    summary: string;
    sections: any[];
    tags: {
        name: string;
        color: string;
    }[];
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
    // if this is an empty string, the ticket will start off in the backlog
    startingColumnId: string;
}