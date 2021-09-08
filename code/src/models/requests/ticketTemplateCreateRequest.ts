import { Section } from "../database/sections";

export interface ITicketTemplateCreateRequest {
    name: string;
    description: string;
    title: {
        label: string;
    };
    summary: {
        label: string;
    };
    sections: Section[];
    priorityWeightingCalculation: string;
}
