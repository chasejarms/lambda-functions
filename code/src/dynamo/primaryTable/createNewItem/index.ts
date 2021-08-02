import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";

export interface IDatabaseItem extends IDefaultPrimaryTableModel {
    [attribute: string]: any;
}

/**
 *
 * @param itemId The partition key of the item for the primary table
 * @param belongsTo The sort key of the item for the primary table
 * @returns If the item already exists, null is returned. Otherwise the created item is returned.
 */
export async function createNewItemInPrimaryTable<T extends IDatabaseItem>(
    item: IDatabaseItem
): Promise<T> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        await dynamoClient
            .put({
                TableName: primaryTableName,
                Item: {
                    ...item,
                },
                ConditionExpression: "attribute_not_exists(itemId)",
            })
            .promise();

        return item as T;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }
        return null;
    }
}
