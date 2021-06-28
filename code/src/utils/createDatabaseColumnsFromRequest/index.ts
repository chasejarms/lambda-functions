import { IBoardColumnRequest } from "../../models/requests/boardColumnRequest";
import { IBoardColumn } from "../../models/database/boardColumns";
import { generateUniqueId } from "../generateUniqueId";

export function createDatabaseColumnsFromRequest(
    columns: IBoardColumnRequest[]
): IBoardColumn[] {
    const existingColumnIds = columns.reduce<{
        [id: string]: boolean;
    }>((mapping, { id }) => {
        mapping[id] = true;
        return mapping;
    }, {});

    const updatedColumnInformation: IBoardColumn[] = columns.map((column) => {
        if (column.id) {
            return column as IBoardColumn;
        }

        let generatedIdIsUnique = false;
        let generatedId: string;
        while (!generatedIdIsUnique) {
            generatedId = generateUniqueId(1);
            generatedIdIsUnique = existingColumnIds[generatedId] === undefined;
        }

        existingColumnIds[generatedId] = true;

        return {
            id: generatedId,
            name: column.name,
            canBeModified: column.canBeModified,
        };
    });

    return updatedColumnInformation;
}
