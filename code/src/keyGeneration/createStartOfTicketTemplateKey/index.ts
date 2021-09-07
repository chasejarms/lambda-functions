export function createStartOfTicketTemplateKey(
    companyId: string,
    boardId: string
) {
    return `COMPANY.${companyId}_BOARD.${boardId}_TICKETTEMPLATE.`;
}
