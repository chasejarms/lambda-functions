import {
    ITransactWriteItem,
    transacteWriteIfNotExistsInPrimaryTable,
} from "../transactWriteIfNotExists";

export async function tryTransactWriteThreeTimesIfNotExistsInPrimaryTable(
    generateItemsCallback: () => ITransactWriteItem[]
): Promise<boolean> {
    let transactAttemptCount = 0;

    while (transactAttemptCount < 3) {
        const transactWriteItems = generateItemsCallback();

        const transactWriteWasSuccessful = transacteWriteIfNotExistsInPrimaryTable(
            ...transactWriteItems
        );

        if (transactWriteWasSuccessful) {
            return true;
        }
    }

    return false;
}
