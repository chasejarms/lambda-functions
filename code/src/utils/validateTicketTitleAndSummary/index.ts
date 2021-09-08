import * as Joi from "joi";

export function validateTicketTitleAndSummary(title: string, summary: string) {
    const titleValidation = Joi.string();

    let summaryValidation = Joi.string();
    summaryValidation = summaryValidation.required();

    const validationSchema = Joi.object({
        title: titleValidation,
        summary: summaryValidation,
    });

    const { error } = validationSchema.validate({
        title,
        summary,
    });

    return error?.message || "";
}
