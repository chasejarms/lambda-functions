import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/httpStatusCode";
import { userSubFromEvent } from "../../utils/userSubFromEvent";
import * as AWS from "aws-sdk";
import { IDefaultPrimaryTableModel } from "../../models/defaultPrimaryTableModel";
import { primaryTableName } from "../../constants/primaryTableName";
import { ICompanyInformation } from "../../models/companyInformation";
import { ICompanyUser } from "../../models/companyUser";

export const getCompaniesForUser = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const userSub = userSubFromEvent(event);
    if (userSub === "") {
        return {
            statusCode: HttpStatusCode.BadRequest,
            body: JSON.stringify({
                message: "Issue getting the user sub from the event",
            }),
        };
    }

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    try {
        const getCompanyUserResults = await dynamoClient
            .query({
                TableName: primaryTableName,
                KeyConditionExpression: "itemId = :itemId",
                ExpressionAttributeValues: {
                    ":itemId": `COMPANYUSER.${userSub}`,
                },
            })
            .promise();

        if (getCompanyUserResults.Items.length === 0) {
            return {
                statusCode: HttpStatusCode.Ok,
                body: JSON.stringify({
                    items: [],
                }),
            };
        }

        const companyUserItems = getCompanyUserResults.Items as ICompanyUser[];

        const getCompanyInformationResults = await dynamoClient
            .batchGet({
                RequestItems: {
                    [primaryTableName]: {
                        Keys: companyUserItems.map((item) => {
                            const companyId = item.belongsTo.split(".")[1];
                            const companyInformationItem: IDefaultPrimaryTableModel = {
                                itemId: `COMPANYINFORMATION_COMPANY.${companyId}`,
                                belongsTo: `COMPANY.${companyId}`,
                            };
                            return companyInformationItem;
                        }),
                    },
                },
            })
            .promise();

        const companyInformationItems = getCompanyInformationResults.Responses[
            primaryTableName
        ] as ICompanyInformation[];
        const companyInformationItemsForResponse = companyInformationItems.map(
            (companyInformationItem) => {
                const companyId = companyInformationItem.itemId.split(".")[1];
                return {
                    name: companyInformationItem.name,
                    companyId,
                };
            }
        );

        return {
            statusCode: HttpStatusCode.Ok,
            body: JSON.stringify({
                items: companyInformationItemsForResponse,
            }),
        };
    } catch (error) {
        const awsError = error as AWS.AWSError;
        return {
            statusCode: awsError.statusCode,
            body: JSON.stringify({
                message: awsError.message,
            }),
        };
    }
};
