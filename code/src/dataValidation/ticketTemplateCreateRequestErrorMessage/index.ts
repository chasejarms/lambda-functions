import { ITicketTemplateCreateRequest } from "../../models/requests/ticketTemplateCreateRequest";
import * as Joi from "joi";
import { colors } from "../../models/database/color";

export const ticketTemplateCreateRequestErrorMessageMapping = {
    nameIsRequired: "The ticket template name is required",
    descriptionIsRequired: "The ticket template description is required",
    titleIsRequired: "A label for the ticket template title is required",
    summaryIsRequired: "A label for the ticket template summary is required",
    sectionsIsInvalid: "The sections list is invalid",
};

export function ticketTemplateCreateRequestErrorMessage(
    ticketTemplate: ITicketTemplateCreateRequest
): string {
    const ticketTemplateSchema = Joi.object({
        name: Joi.string()
            .required()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.nameIsRequired
                )
            ),
        description: Joi.string()
            .required()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.descriptionIsRequired
                )
            ),
        title: Joi.object({
            label: Joi.string()
                .required()
                .error(
                    new Error(
                        ticketTemplateCreateRequestErrorMessageMapping.titleIsRequired
                    )
                ),
        })
            .required()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.titleIsRequired
                )
            ),
        summary: Joi.object({
            label: Joi.string()
                .required()
                .error(
                    new Error(
                        ticketTemplateCreateRequestErrorMessageMapping.summaryIsRequired
                    )
                ),
        })
            .required()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.summaryIsRequired
                )
            ),
        sections: Joi.array()
            .items(
                Joi.object({
                    type: Joi.string().required().valid("text"),
                    label: Joi.string().required(),
                    multiline: Joi.bool().required(),
                    required: Joi.bool().required(),
                }),
                Joi.object({
                    type: Joi.string().required().valid("number"),
                    label: Joi.string().required(),
                    required: Joi.bool().required(),
                    minValue: Joi.number(),
                    maxValue: Joi.number(),
                    allowOnlyIntegers: Joi.bool().required(),
                    alias: Joi.string().allow(""),
                })
            )
            .required()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                )
            ),
        priorityWeightingCalculation: Joi.string().allow(""),
        color: Joi.string()
            .valid(...colors)
            .optional(),
    });

    const { error } = ticketTemplateSchema.validate(ticketTemplate);
    return error ? error.message : "";
}
