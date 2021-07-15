export function createAllDoneTicketsKey(companyId: string, boardId: string) {
    return `COMPANY.${companyId}_BOARD.${boardId}_DONETICKETS`;
}
