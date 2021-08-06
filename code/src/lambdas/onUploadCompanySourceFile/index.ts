import { S3Handler } from "aws-lambda";

export const onUploadCompanySourceFile: S3Handler = async (event) => {
    const key = decodeURIComponent(
        event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    const size = event.Records[0].s3.object.size;
    console.log("key: ", key);
    console.log("size: ", size);
};
