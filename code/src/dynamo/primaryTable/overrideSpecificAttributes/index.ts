import * as AWS from "aws-sdk";
import { primaryTableName } from "../../../constants/primaryTableName";

/**
 *
 * @param itemId The partition key of the item for the primary table
 * @param belongsTo The sort key of the item for the primary table
 * @returns The attributes that you want to override
 */
export async function overrideSpecificAttributesInPrimaryTable<T>(
    itemId: string,
    belongsTo: string,
    itemAttributes: {
        [attributeName: string]: any;
    },
    logUpdateItemInput: boolean = false
): Promise<T> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    const [
        updateExpression,
        expressionAttributeValues,
        expressionAttributeNamesInternal,
    ] = (function () {
        const additionalUpdateExpressionValues: string[] = [];
        const expressionAttributeValuesInternal: {
            [key: string]: any;
        } = {};
        const expressionAttributeNamesInternal: {
            [key: string]: any;
        } = {};

        Object.keys(itemAttributes).forEach((key, index) => {
            const value = itemAttributes[key];
            const valueAlias = `:${String.fromCharCode(index + 97)}`;
            const nameAlias = `#${key}`;

            additionalUpdateExpressionValues.push(`${nameAlias}=${valueAlias}`);

            expressionAttributeValuesInternal[valueAlias] = value;
            expressionAttributeNamesInternal[nameAlias] = key;
        });

        const updateExpressionInternal = `set ${additionalUpdateExpressionValues.join(
            ", "
        )}`;

        return [
            updateExpressionInternal,
            expressionAttributeValuesInternal,
            expressionAttributeNamesInternal,
        ];
    })();

    const updateItemInput: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: primaryTableName,
        Key: {
            itemId: itemId,
            belongsTo: belongsTo,
        },
        UpdateExpression: updateExpression as string,
        ExpressionAttributeValues: expressionAttributeValues as {
            [key: string]: any;
        },
        ExpressionAttributeNames: expressionAttributeNamesInternal as {
            [key: string]: any;
        },
        ReturnValues: "UPDATED_NEW",
    };

    if (logUpdateItemInput) {
        console.log("updateItemInput: ", updateItemInput);
    }

    try {
        const updateItemOutput = await dynamoClient
            .update(updateItemInput)
            .promise();

        return updateItemOutput.Attributes as T;
    } catch (error) {
        console.log("updateItemInput: ", updateItemInput);

        const awsError = error as AWS.AWSError;
        if (awsError.message && awsError.statusCode) {
            console.log("error message: ", awsError.message);
            console.log("error status code: ", awsError.statusCode);
        }
        return null;
    }
}
