import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";

export async function hasCanManageCompanyUsersRight(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    const user = await getUser(event, companyId);
    if (user === null) {
        return false;
    }

    return user.canManageCompanyUsers;
}
