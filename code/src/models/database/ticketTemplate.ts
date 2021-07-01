import { IDefaultPrimaryTableModel } from "./defaultPrimaryTableModel";
import { ITicketTemplateCreateRequest } from "../requests/ticketTemplateCreateRequest";

export type ITicketTemplate = IDefaultPrimaryTableModel &
    ITicketTemplateCreateRequest;
