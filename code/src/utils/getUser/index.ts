import { createCompanyKey } from "../createCompanyKey";
import { createUserKey } from "../createUserKey";
import { getItemFromPrimaryTable } from "../getItemFromPrimaryTable";
import { IUser } from "../../models/database/user";

/**
 *
 * @param userId The id of the user
 * @param companyId The id of the company
 * @returns The user if found. Otherwise null.
 */
export async function getUser(
    userId: string,
    companyId: string
): Promise<IUser> {
    const companyKey = createCompanyKey(companyId);
    const userKey = createUserKey(userId);

    try {
        const user = await getItemFromPrimaryTable<IUser>(userKey, companyKey);
    } catch (error) {
        return null;
    }
}
