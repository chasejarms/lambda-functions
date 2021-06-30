export function createCompanyUserAlphabeticalSortKey(
    name: string,
    userId: string
) {
    const fullNamePutTogether = name.split(" ").join("").toUpperCase();
    return `NAME.${fullNamePutTogether}_USER.${userId}`;
}
