import { ITicketTemplateCreateRequest } from "../../models/requests/ticketTemplateCreateRequest";
import * as Joi from "joi";
import { colors } from "../../models/database/color";
import { INumberSection } from "../../models/database/sections/numberSection";
import mathEvaluator from "math-expression-evaluator";

export const ticketTemplateCreateRequestErrorMessageMapping = {
    nameIsRequired: "The ticket template name is required",
    descriptionIsRequired: "The ticket template description is required",
    titleIsRequired: "A label for the ticket template title is required",
    summaryIsRequired: "A label for the ticket template summary is required",
    sectionsIsInvalid: "The sections list is invalid",
    priorityWeightingCalculation:
        "There was an error with the priority weighting calculation",
    colorError: "An invalid color was provided",
    providedAliasNotValid: "The provided aliases are not valid.",
    calculationError: "There was an error running a test calculation",
    duplicateAlias: "An alias was used more than once",
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
                    minValue: Joi.number().max(
                        Joi.ref("maxValue", {
                            adjust: (value) => {
                                if (value === undefined) {
                                    return Infinity;
                                } else {
                                    return value;
                                }
                            },
                        })
                    ),
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
        priorityWeightingCalculation: Joi.string()
            .pattern(new RegExp(/^$|^[a-zA-Z0-9\.\+\-\*\/() ]+$/))
            .allow("")
            .required()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.priorityWeightingCalculation
                )
            ),
        color: Joi.string()
            .valid(...colors)
            .optional()
            .error(
                new Error(
                    ticketTemplateCreateRequestErrorMessageMapping.colorError
                )
            ),
    });

    const { error } = ticketTemplateSchema.validate(ticketTemplate);
    if (error) return error.message;

    const aliasesFromCalculation = ticketTemplate.priorityWeightingCalculation.match(
        /\b[a-zA-Z]+/g
    );

    const aliasesAreValid = aliasesFromCalculation
        ? aliasesFromCalculation.every((trimmedWord) => {
              return trimmedWord.match(/^$|^[a-zA-Z]+$/);
          })
        : true;

    if (!aliasesAreValid) {
        return ticketTemplateCreateRequestErrorMessageMapping.providedAliasNotValid;
    }

    const sectionsWithAliases = ticketTemplate.sections.filter((section) => {
        return section.type === "number" && !!section.alias;
    });
    const validAliasMapping = sectionsWithAliases.reduce<{
        [aliasName: string]: true;
    }>((mapping, section) => {
        const alias = (section as INumberSection).alias;
        mapping[alias] = true;
        return mapping;
    }, {});

    if (sectionsWithAliases.length !== Object.keys(validAliasMapping).length) {
        return ticketTemplateCreateRequestErrorMessageMapping.duplicateAlias;
    }

    try {
        let expressionToEvaluate = ticketTemplate.priorityWeightingCalculation;
        if (expressionToEvaluate !== "") {
            Object.keys(validAliasMapping).forEach((key) => {
                expressionToEvaluate = expressionToEvaluate.replace(
                    new RegExp(key, "g"),
                    "1"
                );
            });
            mathEvaluator.eval(expressionToEvaluate);
        }
    } catch (e) {
        return ticketTemplateCreateRequestErrorMessageMapping.calculationError;
    }

    return "";
}
