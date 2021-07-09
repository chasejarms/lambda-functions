export function createInProgressTicketKey(
    companyId: string,
    boardId: string,
    ticketId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_INPROGRESSTICKET.${ticketId}`;
}
