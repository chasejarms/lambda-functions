import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { ITicketTemplatePutRequest } from "../requests/ticketTemplatePutRequest";

export type ITicketTemplate = IDefaultPrimaryTableModel &
    ITicketTemplatePutRequest & {
        shortenedItemId: string;
        hasBeenDeleted?: boolean;
    };
