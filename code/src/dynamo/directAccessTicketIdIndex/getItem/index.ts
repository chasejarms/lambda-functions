import * as AWS from "aws-sdk";
import { ticketIdToTicketInformation } from "../../../constants/ticketIdToTicketInformation";
import { GetItemInput } from "aws-sdk/clients/dynamodb";

/**
 *
 * @param ticketId The id of the ticket
 * @returns If the item exists, it's returned. If it's not, null is returned.
 */
export async function getItemFromDirectAccessTicketIdIndex<T>(
    ticketId: string
): Promise<T> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    const Key = {
        directAccessTicketId: ticketId,
    };

    const getItemInput: GetItemInput = {
        TableName: ticketIdToTicketInformation,
        Key: Key as any,
    };

    try {
        const getResult = await dynamoClient.get(getItemInput).promise();

        if (getResult.Item) {
            return getResult.Item as T;
        } else {
            return null;
        }
    } catch (error) {
        const awsError = error as AWS.AWSError;

        console.log("getItemInput: ", getItemInput);

        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
