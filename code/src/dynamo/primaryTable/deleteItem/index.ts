import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";

/**
 *
 * @param itemId The partition key of the item for the primary table
 * @param belongsTo The sort key of the item for the primary table
 * @returns If the item exists, it's returned. If it's not, null is returned.
 */
export async function deleteItemFromPrimaryTable(
    itemId: string,
    belongsTo: string
): Promise<boolean> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    const primaryTableDeleteKey: IDefaultPrimaryTableModel = {
        itemId,
        belongsTo,
    };

    try {
        await dynamoClient
            .delete({
                TableName: primaryTableName,
                Key: primaryTableDeleteKey,
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
