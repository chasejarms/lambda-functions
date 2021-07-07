export function createTagKey(
    companyId: string,
    boardId: string,
    tagName: string
) {
    const combinedTagName = tagName.toUpperCase().split(" ").join("-");
    return `COMPANY.${companyId}_BOARD.${boardId}_TAG.${combinedTagName}`;
}
