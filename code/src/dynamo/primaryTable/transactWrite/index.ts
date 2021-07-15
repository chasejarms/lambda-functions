import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";
import { IDefaultPrimaryTableModel } from "../../../models/database/defaultPrimaryTableModel";
import { Put, Delete } from "aws-sdk/clients/dynamodb";

interface ITransactWriteItem extends IDefaultPrimaryTableModel {
    [attribute: string]: any;
}

export enum TransactWriteItemType {
    Put = "Put",
    Delete = "Delete",
}

export type TransactWriteItemParameter =
    | ITransactWriteItemPutParameter
    | ITransactWriteItemDeleteParameter;

export interface ITransactWriteItemPutParameter {
    type: TransactWriteItemType.Put;
    item: ITransactWriteItem;
    canOverrideExistingItem: boolean;
}

export interface ITransactWriteItemDeleteParameter {
    type: TransactWriteItemType.Delete;
    itemId: string;
    belongsTo: string;
}

export async function transactWriteInPrimaryTable(
    ...transactWriteItemParameters: TransactWriteItemParameter[]
): Promise<boolean> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const itemsForWrite: AWS.DynamoDB.DocumentClient.TransactWriteItemList = transactWriteItemParameters.map(
        (transactWriteItemParameter) => {
            if (transactWriteItemParameter.type === TransactWriteItemType.Put) {
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

            if (
                transactWriteItemParameter.type === TransactWriteItemType.Delete
            ) {
                const deleteItem: Delete = {
                    TableName: primaryTableName,
                    Key: {
                        // casting these as any because Delete seems to have the wrong typing
                        itemId: transactWriteItemParameter.itemId as any,
                        belongsTo: transactWriteItemParameter.belongsTo as any,
                    },
                };

                return {
                    Delete: deleteItem,
                };
            }
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

        itemsForWrite.forEach((item) => {
            console.log("item for write: ", JSON.stringify(item));
        });

        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }

        return null;
    }
}
