export function createTicketThumbnailFileS3StorageKey(
    companyId: string,
    boardId: string,
    ticketId: string,
    fileName: string
) {
    return `COMPANIES-THUMBNAIL-FILES/${companyId}/BOARDS/${boardId}/TICKETS/${ticketId}/${fileName}`;
}
