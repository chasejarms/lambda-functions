export function createStartOfTicketTemplateKey(
    companyId: string,
    boardId: string,
    version?: number
) {
    const endOfKey = version === undefined ? "" : version;
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKETTEMPLATEVERSION.V${endOfKey}`;
}
