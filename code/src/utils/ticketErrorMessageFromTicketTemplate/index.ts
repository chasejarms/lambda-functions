import * as Joi from "joi";
import { ISimplifiedTicketTemplate } from "../../models/requests/simplifiedTicketTemplate";

export function ticketErrorMessageFromTicketTemplate(
    title: string,
    summary: string,
    simplifiedTicketTemplate: ISimplifiedTicketTemplate
) {
    const titleValidation = Joi.string();

    let summaryValidation = Joi.string();
    if (simplifiedTicketTemplate.summary.isRequired) {
        summaryValidation = summaryValidation.required();
    }

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
