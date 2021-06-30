import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { parentToChildIndexName } from "../../../constants/parentToChildIndexName";

export async function queryParentToChildIndexBeginsWith<T>(
    itemIdStart: string,
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
                    ":itemId": itemIdStart,
                },
            })
            .promise();

        return results.Items as T[];
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
