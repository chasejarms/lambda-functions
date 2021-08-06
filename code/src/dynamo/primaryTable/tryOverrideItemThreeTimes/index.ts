import { IDatabaseItem } from "../createNewItem";
import { overrideItemInPrimaryTable } from "../overrideItem";

export async function tryOverrideItemThreeTimes(
    generateItemCallback: () => IDatabaseItem
): Promise<boolean | null> {
    let transactAttemptCount = 0;

    while (transactAttemptCount < 3) {
        const databaseItem = generateItemCallback();
        const { itemId, belongsTo, ...rest } = databaseItem;

        const databaseOverrideWasSuccessful = await overrideItemInPrimaryTable(
            itemId,
            belongsTo,
            rest
        );

        if (databaseOverrideWasSuccessful) {
            return true;
        }

        transactAttemptCount++;
    }

    return null;
}
