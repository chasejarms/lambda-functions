import { Section } from "../database/sections";

export interface ISimplifiedTicketTemplate {
    title: {
        label: string;
    };
    summary: {
        isRequired: boolean;
        label: string;
    };
    sections: Section[];
}
