import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";

export async function batchGetItemsInPrimaryTable<T>(
    ...primaryTableItems: IDefaultPrimaryTableModel[]
): Promise<T[]> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    try {
        const batchGetResults = await dynamoClient
            .batchGet({
                RequestItems: {
                    [primaryTableName]: {
                        Keys: primaryTableItems.map(({ itemId, belongsTo }) => {
                            const partitionAndSortKeyItem = {
                                itemId,
                                belongsTo,
                            };
                            return partitionAndSortKeyItem;
                        }),
                    },
                },
            })
            .promise();

        return batchGetResults.Responses[primaryTableName] as T[];
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
