import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";

export async function queryAllItemsFromPartitionInPrimaryTable<T>(
    itemId: string
): Promise<T[]> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        const queryResults = await dynamoClient
            .query({
                TableName: primaryTableName,
                KeyConditionExpression: "itemId = :itemId",
                ExpressionAttributeValues: {
                    ":itemId": itemId,
                },
            })
            .promise();

        return queryResults.Items as T[];
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
