export function generateUniqueId(numberOfFourCharacterSequences: number = 3) {
    const s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    };

    const sequences = [];
    for (let i = 0; i < numberOfFourCharacterSequences; i++) {
        sequences.push(s4());
    }
    return sequences.join("-");
}
