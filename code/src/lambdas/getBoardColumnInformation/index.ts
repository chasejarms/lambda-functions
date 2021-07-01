import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { createBoardColumnInformationKey } from "../../keyGeneration/createBoardColumnInformationKey";
import { IBoardColumn } from "../../models/database/boardColumn";
import { IBoardColumnInformation } from "../../models/database/boardColumnInformation";

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

    const boardColumnInformation = await getItemFromPrimaryTable<
        IBoardColumnInformation
    >(boardColumnInformationKey, boardColumnInformationKey);
    if (boardColumnInformation === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "could not find board column information for the given board"
        );
    }

    return createSuccessResponse({
        columns: boardColumnInformation.columns,
    });
};
