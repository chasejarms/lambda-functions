import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { deleteItemFromPrimaryTable } from "../../dynamo/primaryTable/deleteItem";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const deleteTicket = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId",
        "itemId",
        "belongsTo"
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
        itemId,
        belongsTo,
    } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
        itemId: string;
        belongsTo: string;
    };

    const canDeleteTicketFromBoard = await isCompanyAdminOrBoardUser(
        event,
        boardId,
        companyId
    );
    if (!canDeleteTicketFromBoard) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to delete ticket from board"
        );
    }

    const itemWasDeleted = await deleteItemFromPrimaryTable(itemId, belongsTo);
    if (itemWasDeleted === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error deleting the item from the board"
        );
    }

    return createSuccessResponse({});
};
