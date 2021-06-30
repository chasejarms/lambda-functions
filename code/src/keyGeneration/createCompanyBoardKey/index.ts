export function createCompanyBoardKey(companyId: string, boardId: string) {
    return `COMPANY.${companyId}_BOARD.${boardId}`;
}
