import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../models/database/defaultPrimaryTableModel";

/**
 *
 * @param itemId The partition key of the item for the primary table
 * @param belongsTo The sort key of the item for the primary table
 * @returns If the item doesn't exist, the promise is rejected
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

    const getResult = await dynamoClient
        .get({
            TableName: primaryTableName,
            Key: primaryTableKeySearch,
        })
        .promise();

    return getResult.Item as T;
}
