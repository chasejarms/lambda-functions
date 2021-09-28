import { Section } from "../database/sections";
import { Color } from "../database/color";

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
    color?: Color;
}
