export function createTicketImageS3StorageKey(
    companyId: string,
    boardId: string,
    ticketId: string,
    fileName: string
) {
    return `COMPANIES/${companyId}/BOARDS/${boardId}/TICKETS/${ticketId}/${fileName}`;
}
