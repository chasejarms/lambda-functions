import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";

export async function isBoardAdmin(
    event: APIGatewayProxyEvent,
    boardId: string,
    companyId: string
): Promise<boolean> {
    const user = await getUser(event, companyId);
    if (user === null) {
        return false;
    }

    const isBoardAdmin =
        user.boardRights &&
        !!user.boardRights[boardId] &&
        !!user.boardRights[boardId].isAdmin;

    return isBoardAdmin;
}
