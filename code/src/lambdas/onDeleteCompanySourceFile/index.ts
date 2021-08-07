import { S3Handler } from "aws-lambda";
import { createTicketFileDynamoItemId } from "../../keyGeneration/createTicketFileDynamoItemId";
import { createAllFilesForTicketKey } from "../../keyGeneration/createAllFilesForTicketKey";
import { deleteItemFromPrimaryTable } from "../../dynamo/primaryTable/deleteItem";

export const onDeleteCompanySourceFile: S3Handler = async (event) => {
    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, " ")
    );

    let companyId: string;
    let boardId: string;
    let ticketId: string;
    let fileName: string;

    const keySplitOnSlashes = key.split("/");
    for (let i = 0; i < keySplitOnSlashes.length; i++) {
        const keySegment = keySplitOnSlashes[i];
        const nextKeySegment = keySplitOnSlashes[i + 1];
        const isLast = i === keySplitOnSlashes.length - 1;
        if (keySegment === "COMPANIES-SOURCE-FILES") {
            companyId = nextKeySegment;
        } else if (keySegment === "BOARDS") {
            boardId = nextKeySegment;
        } else if (keySegment === "TICKETS") {
            ticketId = nextKeySegment;
        } else if (isLast) {
            fileName = keySegment;
        }
    }

    const itemId = createTicketFileDynamoItemId(
        companyId,
        boardId,
        ticketId,
        fileName
    );

    const belongsTo = createAllFilesForTicketKey(companyId, boardId, ticketId);

    const deleteWasSuccessful = await deleteItemFromPrimaryTable(
        itemId,
        belongsTo
    );
    if (deleteWasSuccessful === null) {
        console.log(
            `there was an issue deleting dynamo ticket file with the itemId: ${itemId} and belongsTo: ${belongsTo}`
        );
    }
};
