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
    }
): Promise<T> {
    const dynamoClient = new AWS.DynamoDB.DocumentClient();

    const [updateExpression, expressionAttributeValues] = (function () {
        const additionalUpdateExpressionValues: string[] = [];
        const expressionAttributeValuesInternal: {
            [key: string]: any;
        } = {};

        Object.keys(itemAttributes).forEach((key, index) => {
            const value = itemAttributes[key];
            const valueAlias = `:${String.fromCharCode((index = 97))}`;
            additionalUpdateExpressionValues.push(`info.${key}=${valueAlias}`);

            expressionAttributeValuesInternal[valueAlias] = value;
        });

        const updateExpressionInternal = `set ${additionalUpdateExpressionValues.join(
            ", "
        )}`;

        return [updateExpressionInternal, expressionAttributeValuesInternal];
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
        ReturnValues: "UPDATED_NEW",
    };

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
