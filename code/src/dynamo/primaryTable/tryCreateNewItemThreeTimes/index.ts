import { IDatabaseItem, createNewItemInPrimaryTable } from "../createNewItem";

export async function tryCreateNewItemThreeTimesInPrimaryTable<
    T extends IDatabaseItem
>(generateItemCallback: () => IDatabaseItem): Promise<T | null> {
    let transactAttemptCount = 0;

    while (transactAttemptCount < 3) {
        const databaseItem = generateItemCallback();

        const databaseItemAfterCreate = await createNewItemInPrimaryTable(
            databaseItem
        );

        if (databaseItemAfterCreate) {
            return databaseItemAfterCreate as T;
        }

        transactAttemptCount++;
    }

    return null;
}
