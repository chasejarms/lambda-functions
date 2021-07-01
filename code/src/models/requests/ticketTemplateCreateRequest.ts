import { Section } from "../database/sections";

export interface ITicketTemplateCreateRequest {
    name: string;
    description: string;
    title: {
        label: string;
    };
    summary: {
        isRequired: boolean;
        label: string;
    };
    sections: Section[];
}
