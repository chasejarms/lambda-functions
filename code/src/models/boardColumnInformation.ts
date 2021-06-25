export interface IBoardColumnInformation {
    columns: {
        name: string;
        /*
        id will be provided for existing columns. Added columns will have an id assigned as they come in.
        */
        id?: string;
    }[];
}
