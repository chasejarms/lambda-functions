export function createBoardWeightingFunctionKey(
    companyId: string,
    boardId: string,
    id: string,
    versionNumber: number
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_WEIGHTEDFUNCTIONVERSION.V${versionNumber}_WEIGHTEDFUNCTION.${id}`;
}
