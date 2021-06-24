import { APIGatewayProxyEvent } from "aws-lambda";
import * as AWS from "aws-sdk";
import { getCompanyUser } from "../getCompanyUser";

export async function isCompanyUserAdmin(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    try {
        const companyUser = await getCompanyUser(event, companyId);

        return companyUser.isCompanyAdmin;
    } catch (error) {
        const awsError = error as AWS.AWSError;
        console.log("error checking if the user is a company admin");
        console.log(awsError.message);
        return Promise.reject();
    }
}
