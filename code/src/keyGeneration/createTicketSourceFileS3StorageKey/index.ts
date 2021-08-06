export function createTicketSourceFileS3StorageKey(
    companyId: string,
    boardId: string,
    ticketId: string,
    fileName: string
) {
    return `COMPANIES-SOURCE-FILES/${companyId}/BOARDS/${boardId}/TICKETS/${ticketId}/${fileName}`;
}
