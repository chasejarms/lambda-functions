import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { HttpStatusCode } from "../../models/shared/httpStatusCode";
import { createErrorResponse } from "../../utils/createErrorResponse";
import { createSuccessResponse } from "../../utils/createSuccessResponse";
import { queryParentToChildIndexBeginsWith } from "../../dynamo/parentToChildIndex/queryBeginsWith";
import { isCompanyAdminOrBoardUser } from "../../utils/isCompanyAdminOrBoardUser";
import { createAllBoardTicketTemplatesKey } from "../../keyGeneration/createAllBoardTicketTemplatesKey";
import { createStartOfTicketTemplateKey } from "../../keyGeneration/createStartOfTicketTemplateKey";
import { ITicketTemplate } from "../../models/database/ticketTemplate";
import { isCompanyUserAdminOrBoardAdmin } from "../../utils/isCompanyUserAdminOrBoardAdmin";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { createBoardTicketTemplateKey } from "../../keyGeneration/createBoardTicketTemplateKey";
import { tryCreateNewItemThreeTimesInPrimaryTable } from "../../dynamo/primaryTable/tryCreateNewItemThreeTimes";

export const createTicketTemplateForBoard = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const { companyId, boardId } = event.queryStringParameters;

    if (!companyId || !boardId) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "companyId and boardId are required query parameter"
        );
    }

    const canCreateTicketTemplateForBoard = await isCompanyUserAdminOrBoardAdmin(
        event,
        boardId,
        companyId
    );

    if (!canCreateTicketTemplateForBoard) {
        return createErrorResponse(
            HttpStatusCode.Forbidden,
            "must be a company admin or a board admin to create ticket templates"
        );
    }

    // need to do more validation on the ticket and then use those values from the request

    const createdTicketTemplate = await tryCreateNewItemThreeTimesInPrimaryTable(
        () => {
            const boardTicketTemplateId = generateUniqueId(1);
            const boardTicketTemplateKey = createBoardTicketTemplateKey(
                companyId,
                boardId,
                boardTicketTemplateId
            );
            const allBoardTicketTemplatesKey = createAllBoardTicketTemplatesKey(
                companyId,
                boardId
            );
            const ticketTemplate: ITicketTemplate = {
                itemId: boardTicketTemplateKey,
                belongsTo: allBoardTicketTemplatesKey,
                name: "Default",
                description: "Default ticket template description.",
                title: {
                    isRequired: true,
                    label: "Ticket Title",
                },
                summary: {
                    isRequired: false,
                    label: "Ticket Summary",
                },
                sections: [],
            };

            return ticketTemplate;
        }
    );

    if (createdTicketTemplate === null) {
        return createErrorResponse(
            HttpStatusCode.BadRequest,
            "Error creating the ticket template"
        );
    }

    return createSuccessResponse({
        ticketTemplate: createdTicketTemplate,
    });
};
