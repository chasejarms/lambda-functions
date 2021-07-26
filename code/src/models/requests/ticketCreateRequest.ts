import { ISimplifiedTicketTemplate } from "./simplifiedTicketTemplate";

export interface ITicketCreateRequest {
    title: string;
    summary: string;
    sections: any[];
    tags: {
        name: string;
        color: string;
    }[];
    simplifiedTicketTemplate: ISimplifiedTicketTemplate;
    // if this is an empty string, the ticket will start off in the backlog
    startingColumnId: string;
}
