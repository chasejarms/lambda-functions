import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { getItemFromPrimaryTable } from "../../utils/getItemFromPrimaryTable";
import { createBoardColumnInformationKey } from "../../utils/createBoardColumnInformationKey";
import { IBoardColumn } from "../../models/database/boardColumn";

export const getBoardColumnInformation = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { boardId, companyId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameters"
        );
    }

    const hasSufficientRights = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!hasSufficientRights) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient rights to access this board information"
        );
    }

    const boardColumnInformationKey = createBoardColumnInformationKey(
        companyId,
        boardId
    );

    const boardColumns = await getItemFromPrimaryTable<IBoardColumn[]>(
        boardColumnInformationKey,
        boardColumnInformationKey
    );
    if (boardColumns === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "could not find board column information for the given board"
        );
    }

    return createSuccessResponse({
        boardColumns,
    });
};
