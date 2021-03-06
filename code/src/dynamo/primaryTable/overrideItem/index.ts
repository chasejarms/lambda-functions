import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";

/**
 *
 * @param itemId The partition key of the item for the primary table
 * @param belongsTo The sort key of the item for the primary table
 * @returns If the item exists, it's returned. If it's not, null is returned.
 */
export async function overrideItemInPrimaryTable(
    itemId: string,
    belongsTo: string,
    itemAttributes: {
        [attributeName: string]: any;
    }
): Promise<boolean> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        await dynamoClient
            .put({
                TableName: primaryTableName,
                Item: {
                    itemId,
                    belongsTo,
                    ...itemAttributes,
                },
            })
            .promise();
        return true;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }
        return null;
    }
}
