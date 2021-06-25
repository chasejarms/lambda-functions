import { IBoardColumnRequest } from "./boardColumnRequest";

export interface IBoardColumnInformationRequest {
    columns: IBoardColumnRequest[];
    companyId: string;
    boardId: string;
}
