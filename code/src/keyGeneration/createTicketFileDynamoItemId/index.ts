export function createTicketFileDynamoItemId(
    companyId: string,
    boardId: string,
    ticketId: string,
    fileId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKET.${ticketId}_FILE.${fileId}`;
}
