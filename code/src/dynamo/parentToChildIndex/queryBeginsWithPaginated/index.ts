import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { parentToChildIndexName } from "../../../constants/parentToChildIndexName";
import { Key } from "aws-sdk/clients/dynamodb";

export interface IPaginatedQueryResults<T> {
    items: T[];
    lastEvaluatedKey?: Key;
}

export async function queryParentToChildIndexBeginsWithPaginated<T>(
    itemIdStart: string,
    belongsTo: string,
    limit: number,
    ascendingOrder: boolean = true,
    lastEvaluatedItemId?: string,
    lastEvaluatedBelongsTo?: string
): Promise<IPaginatedQueryResults<T> | null> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const exclusiveStartKey: Key | undefined =
        lastEvaluatedItemId && lastEvaluatedBelongsTo
            ? ({
                  itemId: lastEvaluatedItemId,
                  belongsTo: lastEvaluatedBelongsTo,
              } as any)
            : undefined;

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
                Limit: limit,
                ExclusiveStartKey: exclusiveStartKey,
                ScanIndexForward: ascendingOrder,
            })
            .promise();

        return {
            items: results.Items as T[],
            lastEvaluatedKey: results.LastEvaluatedKey,
        };
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
