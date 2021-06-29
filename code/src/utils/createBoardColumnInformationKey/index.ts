export function createBoardColumnInformationKey(
    companyId: string,
    boardId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_COLUMNINFORMATION`;
}
