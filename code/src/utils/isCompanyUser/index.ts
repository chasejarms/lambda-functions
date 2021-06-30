import { APIGatewayProxyEvent } from "aws-lambda";
import { getUser } from "../getUser";

export async function isCompanyUser(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<boolean> {
    const user = await getUser(event, companyId);
    return user !== null;
}
