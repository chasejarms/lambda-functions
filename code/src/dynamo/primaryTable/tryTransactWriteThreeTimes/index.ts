import { ITransactWriteItem } from "../transactWriteIfNotExists";
import { transactWriteInPrimaryTable } from "../transactWrite";

export async function tryTransactWriteThreeTimesInPrimaryTable(
    generateItemsCallback: () => ITransactWriteItem[]
): Promise<boolean> {
    let transactAttemptCount = 0;

    while (transactAttemptCount < 3) {
        const transactWriteItems = generateItemsCallback();

        const transactWriteWasSuccessful = transactWriteInPrimaryTable(
            ...transactWriteItems
        );

        if (transactWriteWasSuccessful) {
            return true;
        }
    }

    return false;
}
