import { createTicketSourceFileS3StorageFolderKey } from "../createTicketSourceFileS3StorageFolderKey";

export function createTicketSourceFileS3StorageKey(
    companyId: string,
    boardId: string,
    ticketId: string,
    fileName: string
) {
    const folder = createTicketSourceFileS3StorageFolderKey(
        companyId,
        boardId,
        ticketId
    );
    return `${folder}/${fileName}`;
}
