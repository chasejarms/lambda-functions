import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";
import { Put } from "aws-sdk/clients/dynamodb";

interface ITransactWriteItem extends IDefaultPrimaryTableModel {
    [attribute: string]: any;
}

export interface ITransactWriteItemParameter {
    item: ITransactWriteItem;
    canOverrideExistingItem: boolean;
}

export async function transactWriteInPrimaryTable(
    ...transactWriteItemParameters: ITransactWriteItemParameter[]
): Promise<boolean> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const itemsForWrite: AWS.DynamoDB.DocumentClient.TransactWriteItemList = transactWriteItemParameters.map(
        (transactWriteItemParameter) => {
            const put: Put = {
                TableName: primaryTableName,
                Item: {
                    ...transactWriteItemParameter.item,
                },
            };
            if (!transactWriteItemParameter.canOverrideExistingItem) {
                put.ConditionExpression = "attribute_not_exists(itemId)";
            }

            return {
                Put: put,
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
