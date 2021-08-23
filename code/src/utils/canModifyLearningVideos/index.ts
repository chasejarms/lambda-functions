import { APIGatewayProxyEvent } from "aws-lambda";
import { getInternalUser } from "../getInternalUser";

export async function canModifyLearningVideos(event: APIGatewayProxyEvent) {
    const internalUser = await getInternalUser(event);
    if (internalUser === null) {
        return false;
    }

    return internalUser.canModifyLearningVideos;
}
