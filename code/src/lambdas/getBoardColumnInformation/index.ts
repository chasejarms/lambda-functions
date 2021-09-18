import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { getItemFromPrimaryTable } from "../../dynamo/primaryTable/getItem";
import { createBoardColumnInformationKey } from "../../keyGeneration/createBoardColumnInformationKey";
import { IBoardColumnInformation } from "../../models/database/boardColumnInformation";
import { isCompanyUser } from "../../utils/isCompanyUser";
import { doneColumnReservedId } from "../../constants/reservedBoardColumnData";
import { queryStringParametersError } from "../../utils/queryStringParametersError";

export const getBoardColumnInformationInsufficentRights =
    "insufficient rights to access this board information";
export const getBoardColumnInformationCouldNotFindBoard =
    "could not find board column information for the given board";

export const getBoardColumnInformation = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "companyId",
        "boardId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { boardId, companyId } = event.queryStringParameters;

    const hasSufficientRights = await isCompanyUser(event, companyId);
    if (!hasSufficientRights) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            getBoardColumnInformationInsufficentRights
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
            getBoardColumnInformationCouldNotFindBoard
        );
    }

    // this is to account for a legacy value which has been removed on new columns
    const columnsWithoutDoneColumn = boardColumnInformation.columns.filter(
        (column) => {
            return column.id !== doneColumnReservedId;
        }
    );

    return createSuccessResponse({
        columns: columnsWithoutDoneColumn,
    });
};
