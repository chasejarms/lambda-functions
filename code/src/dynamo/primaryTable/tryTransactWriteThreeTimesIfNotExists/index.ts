import {
    ITransactWriteItem,
    transactWriteIfNotExistsInPrimaryTable,
} from "../transactWriteIfNotExists";

export async function tryTransactWriteThreeTimesIfNotExistsInPrimaryTable(
    generateItemsCallback: () => ITransactWriteItem[]
): Promise<boolean> {
    let transactAttemptCount = 0;

    while (transactAttemptCount < 3) {
        const transactWriteItems = generateItemsCallback();

        const transactWriteWasSuccessful = transactWriteIfNotExistsInPrimaryTable(
            ...transactWriteItems
        );

        if (transactWriteWasSuccessful) {
            return true;
        }
    }

    return false;
}
