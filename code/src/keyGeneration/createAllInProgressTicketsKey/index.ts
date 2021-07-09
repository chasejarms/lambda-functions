export function createAllInProgressTicketsKey(
    companyId: string,
    boardId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_INPROGRESSTICKETS`;
}
