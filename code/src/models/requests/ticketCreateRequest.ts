export interface ITicketCreateRequest {
    title: string;
    summary: string;
    sections: any[];
    ticketTemplateShortenedItemId: string;
    // if this is an empty string, the ticket will start off in the backlog
    startingColumnId: string;
}
