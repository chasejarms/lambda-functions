import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";

export async function isBoardUser(
    event: APIGatewayProxyEvent,
    boardId: string,
    companyId: string
): Promise<boolean> {
    const user = await getUser(event, companyId);
    if (user === null) {
        return false;
    }

    const isBoardUser = !!user.boardRights && !!user.boardRights[boardId];
    return isBoardUser;
}
