import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { createSuccessResponse } from "../../utils/createSuccessResponse";

export const createUploadTicketImageSignedUrl = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const client = new S3Client({});
    const command = new GetObjectCommand({
        Bucket: "ticket-files-elastic-project-management-s3-bucket",
        Key: "image.png",
    });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    return createSuccessResponse(url);

    // const bodyIsEmptyErrorResponse = bodyIsEmptyError(event);
    // if (bodyIsEmptyErrorResponse) {
    //     return bodyIsEmptyErrorResponse;
    // }

    // const bodyIsNotAnObjectErrorResponse = bodyIsNotAnObjectError(event);
    // if (bodyIsNotAnObjectErrorResponse) {
    //     return bodyIsNotAnObjectErrorResponse;
    // }

    // const queryStringParametersErrorMessage = queryStringParametersError(
    //     event.queryStringParameters,
    //     "boardId",
    //     "companyId"
    // );
    // if (queryStringParametersErrorMessage) {
    //     return createErrorResponse(
    //         HttpStatusCode.BadRequest,
    //         queryStringParametersErrorMessage
    //     );
    // }

    // const { boardId, companyId } = event.queryStringParameters as {
    //     boardId: string;
    //     companyId: string;
    // };

    // const canCreateTicketForBoard = await isBoardUser(
    //     event,
    //     boardId,
    //     companyId
    // );

    // if (!canCreateTicketForBoard) {
    //     return createErrorResponse(
    //         HttpStatusCode.BadRequest,
    //         "insufficient permissions to create the ticket"
    //     );
    // }

    // const { ticket } = JSON.parse(event.body) as {
    //     ticket: ITicketCreateRequest;
    // };

    // const requestSchema = Joi.object({
    //     title: Joi.string().required(),
    //     summary: Joi.string().allow(""),
    //     sections: Joi.array(),
    //     tags: Joi.array().items(
    //         Joi.object({
    //             name: Joi.string(),
    //             color: Joi.string(),
    //         })
    //     ),
    //     simplifiedTicketTemplate: Joi.object({
    //         title: Joi.object({
    //             label: Joi.string().required(),
    //         }).required(),
    //         summary: Joi.object({
    //             isRequired: Joi.boolean().required(),
    //             label: Joi.string().required(),
    //         }),
    //         sections: Joi.array(),
    //     }).required(),
    //     startingColumnId: Joi.string().allow(""),
    // });

    // const { error } = requestSchema.validate(ticket);
    // if (error) {
    //     return createErrorResponse(HttpStatusCode.BadRequest, error.message);
    // }

    // const errorFromTicketSections = ticketSectionsError(
    //     ticket.sections,
    //     ticket.simplifiedTicketTemplate.sections
    // );
    // if (errorFromTicketSections) {
    //     return createErrorResponse(
    //         HttpStatusCode.BadRequest,
    //         errorFromTicketSections
    //     );
    // }

    // const ticketErrorMessage = ticketErrorMessageFromTicketTemplate(
    //     ticket.title,
    //     ticket.summary,
    //     ticket.simplifiedTicketTemplate
    // );
    // if (ticketErrorMessage) {
    //     return createErrorResponse(
    //         HttpStatusCode.BadRequest,
    //         ticketErrorMessage
    //     );
    // }

    // let uniqueTicketIdAttempts = 0;
    // let ticketId: string;
    // let directAccessTicketIdKey: string;

    // while (uniqueTicketIdAttempts < 3) {
    //     ticketId = generateUniqueId();

    //     directAccessTicketIdKey = createDirectAccessTicketIdKey(
    //         companyId,
    //         boardId,
    //         ticketId
    //     );

    //     const ticket = await getItemFromDirectAccessTicketIdIndex<ITicket>(
    //         directAccessTicketIdKey
    //     );
    //     if (ticket === null) {
    //         break;
    //     }

    //     uniqueTicketIdAttempts++;
    // }

    // const ticketAfterDatabaseCreation = await tryCreateNewItemThreeTimesInPrimaryTable<
    //     ITicket
    // >(() => {
    //     const sendTicketToBacklog = ticket.startingColumnId === "";
    //     const itemId = sendTicketToBacklog
    //         ? createBacklogTicketKey(companyId, boardId, ticketId)
    //         : createInProgressTicketKey(companyId, boardId, ticketId);
    //     const belongsTo = sendTicketToBacklog
    //         ? createAllBacklogTicketsKey(companyId, boardId)
    //         : createAllInProgressTicketsKey(companyId, boardId);

    //     const nowTimestamp = Date.now().toString();
    //     const ticketForDatabase: ITicket = {
    //         shortenedItemId: ticketId,
    //         directAccessTicketId: directAccessTicketIdKey,
    //         itemId,
    //         belongsTo,
    //         title: ticket.title,
    //         summary: ticket.summary,
    //         sections: ticket.sections,
    //         tags: ticket.tags,
    //         simplifiedTicketTemplate: ticket.simplifiedTicketTemplate,
    //         createdTimestamp: nowTimestamp,
    //         lastModifiedTimestamp: nowTimestamp,
    //         completedTimestamp: "",
    //         columnId: sendTicketToBacklog ? "" : ticket.startingColumnId,
    //     };

    //     return ticketForDatabase;
    // });

    // if (!ticketAfterDatabaseCreation) {
    //     return createErrorResponse(
    //         HttpStatusCode.BadRequest,
    //         "There was an error creating the ticket in the database"
    //     );
    // }

    // return createSuccessResponse({
    //     ticket: ticketAfterDatabaseCreation,
    // });
};
