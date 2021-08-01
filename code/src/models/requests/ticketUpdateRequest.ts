import { ISimplifiedTag } from "../shared/simplifiedTag";

export interface ITicketUpdateRequest {
    title: string;
    summary: string;
    tags: ISimplifiedTag[];
    sections: any[];
}
