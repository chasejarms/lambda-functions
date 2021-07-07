export function createAllTagsKey(companyId: string, boardId: string) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TAGS`;
}
