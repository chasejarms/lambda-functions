import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { IBoard } from "../../models/database/board";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { createCompanyBoardsKey } from "../../keyGeneration/createCompanyBoardsKey";
import { createStartOfBoardKey } from "../../keyGeneration/createStartOfBoardKey";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { isCompanyUser } from "../../utils/isCompanyUser";

export const getBoardsForCompanyErrors = {
    insufficientRights:
        "must be a user on the company to get boards for the company",
    dynamoError: "Error getting the boards from dynamo",
};

export const getBoardsForCompany = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId } = event.queryStringParameters;

    const canGetBoardsForCompany = await isCompanyUser(event, companyId);
    if (!canGetBoardsForCompany) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            getBoardsForCompanyErrors.insufficientRights
        );
    }

    const companyBoardsKey = createCompanyBoardsKey(companyId);
    const startOfBoardKey = createStartOfBoardKey(companyId);
    const boardItems = await queryParentToChildIndexBeginsWith<IBoard>(
        startOfBoardKey,
        companyBoardsKey
    );

    if (boardItems === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            getBoardsForCompanyErrors.dynamoError
        );
    }

    const onlyActiveBoards = boardItems.filter((boardItem) => {
        return !boardItem.hasBeenDeleted;
    });

    return createSuccessResponse({
        items: onlyActiveBoards,
    });
};
