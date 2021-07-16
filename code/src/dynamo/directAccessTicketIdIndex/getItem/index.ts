import * as AWS from "aws-sdk";
import { directAccessTicketIdIndexName } from "../../../constants/directAccessTicketIdIndexName";
import { GetItemInput, QueryInput } from "aws-sdk/clients/dynamodb";
import { primaryTableName } from "../../../constants/primaryTableName";

/**
 *
 * @param ticketId The id of the ticket
 * @returns If the item exists, it's returned. If it's not, null is returned.
 */
export async function getItemFromDirectAccessTicketIdIndex<T>(
    directAccessTicketId: string
): Promise<T> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    const queryInput: QueryInput = {
        TableName: primaryTableName,
        IndexName: directAccessTicketIdIndexName,
        KeyConditionExpression: `directAccessTicketId = :directAccessTicketId`,
        ExpressionAttributeValues: {
            ":directAccessTicketId": directAccessTicketId,
        } as any,
    };

    try {
        const results = await dynamoClient.query(queryInput).promise();

        return results.Items[0] as T;
    } catch (error) {
        const awsError = error as AWS.AWSError;

        console.log("queryInput: ", queryInput);

        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
