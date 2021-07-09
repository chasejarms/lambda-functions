export function createAllBacklogTicketsKey(companyId: string, boardId: string) {
    return `COMPANY.${companyId}_BOARD.${boardId}_BACKLOGTICKETS`;
}
