export function createAllBoardWeightingFunctionsKey(
    companyId: string,
    boardId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_WEIGHTINGFUNCTIONS`;
}
