import { APIGatewayProxyEvent } from "aws-lambda";
import { userSubFromEvent } from "../userSubFromEvent";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { ICompanyUser } from "../../models/companyUser";

export async function isCompanyUserAdmin(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    const userSub = userSubFromEvent(event);

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    try {
        const getCompanyUserResult = await dynamoClient
            .get({
                TableName: primaryTableName,
                Key: {
                    ItemId: `COMPANYUSER.${userSub}`,
                    BelongsTo: `COMPANY.${companyId}`,
                },
            })
            .promise();

        const companyUser = getCompanyUserResult.Item as ICompanyUser;
        return companyUser.isCompanyAdmin;
    } catch (error) {
        console.log("error checking if the user is a company admin");
        return false;
    }
}
