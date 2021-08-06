import { S3Handler } from "aws-lambda";
import { createTicketFileDynamoItemId } from "../../keyGeneration/createTicketFileDynamoItemId";
// import { generateUniqueId } from "../../utils/generateUniqueId";
import { createAllFilesForTicketKey } from "../../keyGeneration/createAllFilesForTicketKey";
import { tryOverrideItemThreeTimes } from "../../dynamo/primaryTable/tryOverrideItemThreeTimes";
import { IFileForTicket } from "../../models/database/fileForTicket";
// import * as AWS from "aws-sdk";
// import * as sharp from "sharp";
// import { PromiseResult } from "aws-sdk/lib/request";
// import { createTicketThumbnailFileS3StorageKey } from "../../keyGeneration/createTicketThumbnailFileS3Key";

export const onUploadCompanySourceFile: S3Handler = async (event) => {
    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const size = event.Records[0].s3.object.size;
    // const bucket = event.Records[0].s3.bucket.name;

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

    const typeMatch = fileName.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }
    const imageType = typeMatch[1] ? typeMatch[1].toLowerCase() : "";
    const isPngOrJpg = imageType === "jpg" || imageType === "png";

    const overrideWasSuccessful = await tryOverrideItemThreeTimes(() => {
        const itemId = createTicketFileDynamoItemId(
            companyId,
            boardId,
            ticketId,
            fileName
        );

        const belongsTo = createAllFilesForTicketKey(
            companyId,
            boardId,
            ticketId
        );

        const fileForTicket: IFileForTicket = {
            itemId,
            belongsTo,
            srcUrl: key,
            thumbnailUrl: "",
            size,
            fileName,
            isPngOrJpg,
        };

        return fileForTicket;
    });

    if (overrideWasSuccessful === null) {
        console.log(
            "A file uploaded to S3 failed when moving metadata information into dynamo"
        );
        return;
    }

    // comment all of this back in once you start doing thumbnail images
    // if (!isPngOrJpg) {
    //     console.log(
    //         `unsupported image type for thumbnail creation: ${imageType}`
    //     );
    //     return;
    // }

    // const s3 = new AWS.S3();

    // let originalImage: PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>;
    // try {
    //     const params = {
    //         Bucket: bucket,
    //         Key: key,
    //     };
    //     originalImage = await s3.getObject(params).promise();
    // } catch (error) {
    //     console.log(error);
    //     return;
    // }

    // try {
    //     const width = 400;
    //     var buffer = await sharp(originalImage.Body.toString(), undefined)
    //         .resize(width)
    //         .toBuffer();
    // } catch (error) {
    //     console.log(error);
    //     return;
    // }

    // try {
    //     const destinationKey = createTicketThumbnailFileS3StorageKey(
    //         companyId,
    //         boardId,
    //         ticketId,
    //         fileName
    //     );
    //     const destparams = {
    //         Bucket: "elastic-project-management-company-thumbnail-files",
    //         Key: destinationKey,
    //         Body: buffer,
    //         ContentType: "image",
    //     };

    //     await s3.putObject(destparams).promise();
    // } catch (error) {
    //     console.log(error);
    //     return;
    // }
};
