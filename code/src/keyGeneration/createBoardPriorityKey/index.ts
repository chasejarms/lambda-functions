export function createBoardPriorityKey(companyId: string, boardId: string) {
    return `COMPANY.${companyId}_BOARD.${boardId}_PRIORITYLIST`;
}
