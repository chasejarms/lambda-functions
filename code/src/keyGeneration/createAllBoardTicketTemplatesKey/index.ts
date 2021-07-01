export function createAllBoardTicketTemplatesKey(
    companyId: string,
    boardId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKETTEMPLATES`;
}
