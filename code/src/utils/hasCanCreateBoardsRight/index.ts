import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";

export async function hasCanCreateBoardsRight(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    const user = await getUser(event, companyId);
    if (user === null) {
        return false;
    }

    return user.canCreateBoards;
}
