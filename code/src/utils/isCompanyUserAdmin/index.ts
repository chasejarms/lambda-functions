import { APIGatewayProxyEvent } from "aws-lambda";
import { userSubFromEvent } from "../userSubFromEvent";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { ICompanyUser } from "../../models/companyUser";
import { IDefaultPrimaryTableModel } from "../../models/defaultPrimaryTableModel";

export async function isCompanyUserAdmin(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    const userSub = userSubFromEvent(event);

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const primaryTableKeySearch: IDefaultPrimaryTableModel = {
        itemId: `COMPANYUSER.${userSub}`,
        belongsTo: `COMPANY.${companyId}`,
    };
    try {
        const getCompanyUserResult = await dynamoClient
            .get({
                TableName: primaryTableName,
                Key: primaryTableKeySearch,
            })
            .promise();

        const companyUser = getCompanyUserResult.Item as ICompanyUser;
        return companyUser.isCompanyAdmin;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        console.log("error checking if the user is a company admin");
        console.log(awsError.message);
        return false;
    }
}
