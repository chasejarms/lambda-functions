export function createTicketSourceFileS3StorageFolderKey(
    companyId: string,
    boardId: string,
    ticketId: string
) {
    return `COMPANY-${companyId}/BOARD-${boardId}/TICKET-${ticketId}`;
}
