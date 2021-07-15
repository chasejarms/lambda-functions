import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { queryParentToChildIndexBeginsWithPaginated } from "../../dynamo/parentToChildIndex/queryBeginsWithPaginated";
import { createAllDoneTicketsKey } from "../../keyGeneration/createAllDoneTicketsKey";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const getDoneTickets = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "limit"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const {
        boardId,
        companyId,
        limit,
        lastEvaluatedKey,
    } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
        limit: string;
        lastEvaluatedKey?: string;
    };

    const canGetDoneTicketsForBoard = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );

    if (!canGetDoneTicketsForBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to get the completed tickets"
        );
    }

    const allDoneTicketsKey = createAllDoneTicketsKey(companyId, boardId);
    const paginatedQueryResult = await queryParentToChildIndexBeginsWithPaginated(
        "C",
        allDoneTicketsKey,
        Number(limit),
        lastEvaluatedKey as any
    );

    if (paginatedQueryResult === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error getting the paginated query result"
        );
    }

    return createSuccessResponse(paginatedQueryResult);
};
