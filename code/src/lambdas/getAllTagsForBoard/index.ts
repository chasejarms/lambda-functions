import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createAllTagsKey } from "../../keyGeneration/createAllTagsKey";
import { ITag } from "../../models/database/tag";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { isBoardUser } from "../../utils/isBoardUser";

export const getAllTagsForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId a required query parameters"
        );
    }

    const canGetTagsForBoard = await isBoardUser(event, boardId, companyId);
    if (!canGetTagsForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to get the tags for this board"
        );
    }

    const allTagsKey = createAllTagsKey(companyId, boardId);
    const tags = await queryParentToChildIndexBeginsWith<ITag>("C", allTagsKey);

    if (tags === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error getting the tags from dynamo"
        );
    }

    return createSuccessResponse({
        tags,
    });
};
