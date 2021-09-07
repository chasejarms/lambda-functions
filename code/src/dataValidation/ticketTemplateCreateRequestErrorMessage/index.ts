import { ITicketTemplatePutRequest } from "../../models/requests/ticketTemplatePutRequest";
import * as Joi from "joi";

export function ticketTemplateCreateRequestErrorMessage(
    ticketTemplate: ITicketTemplatePutRequest
): string {
    const ticketTemplateSchema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().required(),
        title: Joi.object({
            label: Joi.string().required(),
        }),
        summary: Joi.object({
            label: Joi.string().required(),
        }),
        sections: Joi.array().items(
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
                alias: Joi.string(),
            })
        ),
        priorityWeightingCalculation: Joi.string().required(),
    });

    const { error } = ticketTemplateSchema.validate(ticketTemplate);
    return error ? error.message : "";
}
