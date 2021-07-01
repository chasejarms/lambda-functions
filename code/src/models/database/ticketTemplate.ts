import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { Section } from "./sections";

export interface ITicketTemplate extends IDefaultPrimaryTableModel {
    name: string;
    description: string;
    title: {
        isRequired: true;
        label: string;
    };
    summary: {
        isRequired: boolean;
        label: string;
    };
    sections: Section[];
}
