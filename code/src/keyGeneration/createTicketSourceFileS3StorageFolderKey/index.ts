export function createTicketSourceFileS3StorageFolderKey(
    companyId: string,
    boardId: string,
    ticketId: string
) {
    return `COMPANIES-SOURCE-FILES/${companyId}/BOARDS/${boardId}/TICKETS/${ticketId}/`;
}
