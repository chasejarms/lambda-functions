import {
    transactWriteInPrimaryTable,
    ITransactWriteItemParameter,
} from "../transactWrite";

export async function tryTransactWriteThreeTimesInPrimaryTable(
    generateItemsCallback: () => ITransactWriteItemParameter[]
): Promise<boolean> {
    let transactAttemptCount = 0;

    while (transactAttemptCount < 3) {
        const transactWriteItemParameters = generateItemsCallback();

        const transactWriteWasSuccessful = await transactWriteInPrimaryTable(
            ...transactWriteItemParameters
        );

        if (transactWriteWasSuccessful) {
            return true;
        }
    }

    return false;
}
