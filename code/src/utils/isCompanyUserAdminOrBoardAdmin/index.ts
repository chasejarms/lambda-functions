import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";
import { userSubFromEvent } from "../userSubFromEvent";

export async function isCompanyUserAdminOrBoardAdmin(
    event: APIGatewayProxyEvent,
    boardId: string,
    companyId: string
): Promise<boolean> {
    const userId = userSubFromEvent(event);
    if (userId === "") {
        return false;
    }

    const user = await getUser(userId, companyId);
    if (user === null) return false;

    const isCompanyAdmin = user.isCompanyAdmin;
    const isBoardAdmin =
        user.boardRights &&
        user.boardRights[boardId] &&
        user.boardRights[boardId].isAdmin;

    return isCompanyAdmin || isBoardAdmin;
}
