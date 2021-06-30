import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";

export interface ITransactWriteItem extends IDefaultPrimaryTableModel {
    [attribute: string]: any;
}

export async function transactWriteIfNotExistsInPrimaryTable(
    ...transactWriteItems: ITransactWriteItem[]
): Promise<boolean> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const itemsForWrite: AWS.DynamoDB.DocumentClient.TransactWriteItemList = transactWriteItems.map(
        (transactWriteItem) => {
            return {
                Put: {
                    TableName: primaryTableName,
                    Item: {
                        ...transactWriteItem,
                    },
                    ConditionExpression: "attribute_not_exists(itemId)",
                },
            };
        }
    );

    try {
        await dynamoClient
            .transactWrite({
                TransactItems: itemsForWrite,
            })
            .promise();

        return true;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
