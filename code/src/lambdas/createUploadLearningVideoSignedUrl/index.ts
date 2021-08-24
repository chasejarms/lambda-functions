import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { bodyIsEmptyError } from "../../utils/bodyIsEmptyError";
import { bodyIsNotAnObjectError } from "../../utils/bodyIsNotAnObjectError";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import * as Joi from "joi";
import { canModifyLearningVideos } from "../../utils/canModifyLearningVideos";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { createLearningCenterVideoS3Key } from "../../keyGeneration/createLearningCenterVideoS3Key";

export const createUploadLearningVideoSignedUrl = async (
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

    const hasSufficientRights = await canModifyLearningVideos(event);
    if (!hasSufficientRights) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "insufficient permissions to modify the learning videos"
        );
    }

    const fiveMegabytes = 5000000;
    const requestSchema = Joi.object({
        name: Joi.string()
            .required()
            .pattern(/\s/, { name: "spaces", invert: true }),
        size: Joi.number().required().min(0).max(fiveMegabytes),
        contentType: Joi.string().required().valid("video/mp4"),
    });
    const body = JSON.parse(event.body) as {
        name: string;
        size: number;
        contentType: string;
    };

    const { error } = requestSchema.validate(body);
    if (error) {
        return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    }

    const client = new S3Client({});

    const uniqueId = generateUniqueId();
    const learningCenterS3Key = createLearningCenterVideoS3Key(
        `${body.name}/${uniqueId}`
    );
    const putCommand = new PutObjectCommand({
        Bucket: "learning-center-files",
        Key: learningCenterS3Key,
        ContentLength: body.size,
        ContentType: body.contentType,
    });

    try {
        const signedUrl = await getSignedUrl(client, putCommand, {
            expiresIn: 300,
        });

        return createSuccessResponse({
            signedUrl,
        });
    } catch (error) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "There was an error creating the signed url"
        );
    }
};
