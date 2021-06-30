import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";

/**
 *
 * @param itemId The partition key of the item for the primary table
 * @param belongsTo The sort key of the item for the primary table
 * @returns If the item exists, it's returned. If it's not, null is returned.
 */
export async function getItemFromPrimaryTable<T>(
    itemId: string,
    belongsTo: string
): Promise<T> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    const primaryTableKeySearch: IDefaultPrimaryTableModel = {
        itemId,
        belongsTo,
    };

    try {
        const getResult = await dynamoClient
            .get({
                TableName: primaryTableName,
                Key: primaryTableKeySearch,
            })
            .promise();

        return getResult.Item as T;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
