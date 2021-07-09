export function createBacklogTicketKey(
    companyId: string,
    boardId: string,
    ticketId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_BACKLOGTICKET.${ticketId}`;
}
