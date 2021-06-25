import { APIGatewayProxyEvent } from "aws-lambda";
import { userSubFromEvent } from "../userSubFromEvent";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { ICompanyUser } from "../../models/database/companyUser";
import { IDefaultPrimaryTableModel } from "../../models/database/defaultPrimaryTableModel";

export async function getCompanyUser(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<ICompanyUser> {
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
        return companyUser;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        console.log("error checking if the user is a company admin");
        console.log(awsError.message);
        return Promise.reject();
    }
}
