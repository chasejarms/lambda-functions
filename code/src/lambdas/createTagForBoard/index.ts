import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createTagKey } from "../../keyGeneration/createTagKey";
import { createAllTagsKey } from "../../keyGeneration/createAllTagsKey";
import { createNewItemInPrimaryTable } from "../../dynamo/primaryTable/createNewItem";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isBoardAdmin } from "../../utils/isBoardAdmin";

export const createTagForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const bodyIsEmptyErrorResponse = bodyIsEmptyError(event);
    if (bodyIsEmptyErrorResponse) {
        return bodyIsEmptyErrorResponse;
    }

    const bodyIsNotAnObjectErrorResponse = bodyIsNotAnObjectError(event);
    if (bodyIsNotAnObjectErrorResponse) {
        return bodyIsNotAnObjectErrorResponse;
    }

    const { boardId, companyId } = event.queryStringParameters as {
        boardId: string;
        companyId: string;
    };

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameters"
        );
    }

    const { tagName, tagColor } = JSON.parse(event.body) as {
        tagName: string;
        tagColor: string;
    };

    if (!tagName || !tagColor) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "tagName and tagColor are required fields"
        );
    }

    const canCreateTag = await isBoardAdmin(event, boardId, companyId);

    if (!canCreateTag) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Insufficient permissions to create tag"
        );
    }

    const tagKey = createTagKey(companyId, boardId, tagName);
    const allTagsKey = createAllTagsKey(companyId, boardId);

    const databaseItemAfterCreate = await createNewItemInPrimaryTable({
        itemId: tagKey,
        belongsTo: allTagsKey,
        color: tagColor,
        name: tagName,
    });

    if (!databaseItemAfterCreate) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "A tag with the same name already exists"
        );
    }

    return createSuccessResponse({
        tagInformation: databaseItemAfterCreate,
    });
};
