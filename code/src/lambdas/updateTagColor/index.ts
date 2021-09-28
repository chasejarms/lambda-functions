import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { queryStringParametersError } from "../../utils/queryStringParametersError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { isBoardAdmin } from "../../utils/isBoardAdmin";
import * as Joi from "joi";
import { Color } from "../../models/database/color";
import { createTagKey } from "../../keyGeneration/createTagKey";
import { createAllTagsKey } from "../../keyGeneration/createAllTagsKey";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { overrideSpecificAttributesInPrimaryTable } from "../../dynamo/primaryTable/overrideSpecificAttributes";

export const updateTagColor = async (
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

    const { companyId, boardId } = event.queryStringParameters;

    const canUpdateTagColor = await isBoardAdmin(event, boardId, companyId);
    if (!canUpdateTagColor) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "insufficient permissions to update the tag color"
        );
    }

    const parsedBody = JSON.parse(event.body) as {
        name: string;
        color: Color;
    };

    const requestSchema = Joi.object({
        name: Joi.string().required(),
        color: Joi.string()
            .required()
            .valid(
                Color.Blue,
                Color.Green,
                Color.Grey,
                Color.Red,
                Color.Yellow
            ),
    });

    const { error } = requestSchema.validate(parsedBody);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const tagKey = createTagKey(companyId, boardId, parsedBody.name);
    const allTagsKey = createAllTagsKey(companyId, boardId);
    const itemWasUpdated = await overrideSpecificAttributesInPrimaryTable(
        tagKey,
        allTagsKey,
        {
            color: parsedBody.color,
        }
    );

    if (itemWasUpdated === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "The item failed to update in dynamo"
        );
    }

    return createSuccessResponse({});
};
