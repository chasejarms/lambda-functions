export function createBoardTicketTemplateKey(
    companyId: string,
    boardId: string,
    ticketTemplateId: string,
    versionNumber: number
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKETTEMPLATEVERSION.V${versionNumber}_TICKETTEMPLATE.${ticketTemplateId}`;
}
