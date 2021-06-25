import { APIGatewayProxyEvent } from "aws-lambda";
import { getCompanyUser } from "../getCompanyUser";
import { getBoardUser } from "../getBoardUser";
import { ICompanyUser } from "../../models/database/companyUser";
import { IBoardUser } from "../../models/database/boardUser";
import { createErrorResponse } from "../createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";

export async function isCompanyAdminOrBoardAdmin(
    event: APIGatewayProxyEvent,
    boardId: string,
    companyId: string
): Promise<boolean> {
    let companyUser: ICompanyUser;
    let companyBoardUser: IBoardUser | null;

    try {
        const [
            internalCompanyUser,
            internalCompanyBoardUser,
        ] = await Promise.all([
            getCompanyUser(event, companyId),
            getBoardUser(event, boardId, companyId),
        ]);
        companyUser = internalCompanyUser;
        companyBoardUser = internalCompanyBoardUser;
    } catch (error) {
        /*
        If we've entered this catch block, it's because the user doesn't exist
        on the company which means they also won't be a board user.
        */
        return false;
    }

    if (
        !companyUser.isCompanyAdmin &&
        (!companyBoardUser || !companyBoardUser.isBoardAdmin)
    ) {
        return false;
    }

    return true;
}
