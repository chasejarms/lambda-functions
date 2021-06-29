import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";
import { userSubFromEvent } from "../userSubFromEvent";

export async function isCompanyUser(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    const userId = userSubFromEvent(event);
    if (userId === "") {
        return false;
    }

    const user = await getUser(userId, companyId);
    return user !== null;
}
