export function createAllFilesForTicketKey(
    companyId: string,
    boardId: string,
    ticketId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKET.${ticketId}_FILES`;
}
