import { createCompanyKey } from "../../keyGeneration/createCompanyKey";
import { createUserKey } from "../../keyGeneration/createUserKey";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { IUser } from "../../models/database/user";
import { APIGatewayProxyEvent } from "aws-lambda";
import { userSubFromEvent } from "../userSubFromEvent";

/**
 *
 * @param userId The id of the user
 * @param companyId The id of the company
 * @returns The user if found. Otherwise null.
 */
export async function getUser(
    event: APIGatewayProxyEvent,
    companyId: string
): Promise<IUser | null> {
    const userId = userSubFromEvent(event);
    if (userId === "") {
        return null;
    }

    const companyKey = createCompanyKey(companyId);
    const userKey = createUserKey(userId);

    const user = await getItemFromPrimaryTable<IUser>(userKey, companyKey);
    return user;
}
