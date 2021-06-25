import { APIGatewayProxyEvent } from "aws-lambda";
import { userSubFromEvent } from "../userSubFromEvent";
import * as AWS from "aws-sdk";
import { primaryTableName } from "../../constants/primaryTableName";
import { ICompanyUser } from "../../models/companyUser";
import { IDefaultPrimaryTableModel } from "../../models/defaultPrimaryTableModel";
import { IBoardUser } from "../../models/boardUser";

export async function getBoardUser(
    event: APIGatewayProxyEvent,
    boardId: string,
    companyId: string
): Promise<IBoardUser | null> {
    const userSub = userSubFromEvent(event);

    const dynamoClient = new AWS.DynamoDB.DocumentClient();
    const primaryTableKeySearch: IDefaultPrimaryTableModel = {
        itemId: `BOARDUSER.${userSub}_BOARD.${boardId}`,
        belongsTo: `COMPANY.${companyId}`,
    };
    try {
        const boardUserResult = await dynamoClient
            .get({
                TableName: primaryTableName,
                Key: primaryTableKeySearch,
            })
            .promise();

        const boardUser = boardUserResult.Item as IBoardUser;
        return boardUser;
    } catch (error) {
        return null;
    }
}
