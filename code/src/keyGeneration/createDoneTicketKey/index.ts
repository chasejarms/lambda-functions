export function createDoneTicketKey(
    companyId: string,
    boardId: string,
    ticketId: string,
    completedTimestamp: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_DONETICKET.${ticketId}_COMPLETED.${completedTimestamp}`;
}
