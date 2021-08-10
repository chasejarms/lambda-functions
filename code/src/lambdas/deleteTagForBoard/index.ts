import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import { createTagKey } from "../../keyGeneration/createTagKey";
import * as Joi from "joi";
import { createAllTagsKey } from "../../keyGeneration/createAllTagsKey";
import { deleteItemFromPrimaryTable } from "../../dynamo/primaryTable/deleteItem";

export const deleteTagForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const queryStringParametersErrorMessage = queryStringParametersError(
        event.queryStringParameters,
        "boardId",
        "companyId"
    );
    if (queryStringParametersErrorMessage) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            queryStringParametersErrorMessage
        );
    }

    const { companyId, boardId } = event.queryStringParameters;

    const body = JSON.parse(event.body);
    const requestSchema = Joi.object({
        tagName: Joi.string().required(),
    });

    const { error } = requestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const canDeleteTag = await isBoardAdmin(event, boardId, companyId);
    if (!canDeleteTag) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to delete this tag"
        );
    }

    const tagKey = createTagKey(companyId, boardId, body.tagName);
    const allTagsKey = createAllTagsKey(companyId, boardId);

    const tagWasDeleted = await deleteItemFromPrimaryTable(tagKey, allTagsKey);
    if (tagWasDeleted === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Failed to delete the tag from dynamo"
        );
    }

    return createSuccessResponse({});
};
