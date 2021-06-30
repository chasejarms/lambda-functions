import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { parentToChildIndexName } from "../../constants/parentToChildIndexName";

export async function queryParentToChildIndexBeginsWith<T>(
    itemId: string,
    belongsTo: string
): Promise<T[] | null> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    try {
        const results = await dynamoClient
            .query({
                TableName: primaryTableName,
                IndexName: parentToChildIndexName,
                KeyConditionExpression: `belongsTo = :belongsTo AND begins_with ( itemId, :itemId )`,
                ExpressionAttributeValues: {
                    ":belongsTo": belongsTo,
                    ":itemId": itemId,
                },
            })
            .promise();

        return results.Items as T[];
    } catch (error) {
        return null;
    }
}
