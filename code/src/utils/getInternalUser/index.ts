import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { APIGatewayProxyEvent } from "aws-lambda";
import { userSubFromEvent } from "../userSubFromEvent";
import { createInternalUserKey } from "../../keyGeneration/createInternalUserKey";
import { createAllInternalUsersKey } from "../../keyGeneration/createAllInternalUsersKey";
import { IInternalUser } from "../../models/database/internalUser";

/**
 *
 * @param APIGatewayProxyEvent The api gateway proxy event
 * @returns The internal user if found. Otherwise null.
 */
export async function getInternalUser(
    event: APIGatewayProxyEvent
): Promise<IInternalUser | null> {
    const userId = userSubFromEvent(event);
    if (userId === "") {
        console.log("getUser: user not found");
        return null;
    }

    const internalUserKey = createInternalUserKey(userId);
    const allInternalUsersKey = createAllInternalUsersKey();

    const internalUser = await getItemFromPrimaryTable<IInternalUser>(
        internalUserKey,
        allInternalUsersKey
    );
    if (internalUser === null) {
        console.log("internalUserKey: ", internalUserKey);
        console.log("allInternalUsersKey: ", allInternalUsersKey);
    }
    return internalUser;
}
