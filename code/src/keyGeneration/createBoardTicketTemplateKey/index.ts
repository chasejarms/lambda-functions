export function createBoardTicketTemplateKey(
    companyId: string,
    boardId: string,
    ticketTemplateId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKETTEMPLATE.${ticketTemplateId}`;
}
