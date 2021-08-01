import { Section } from "../../models/database/sections";
import * as Joi from "joi";
import { ITextSection } from "../../models/database/sections/textSection";

export function ticketSectionsError(sectionValues: any[], sections: Section[]) {
    if (sectionValues.length !== sections.length) {
        return "Number of sections does not equal number of required sections.";
    }

    for (let i = 0; i < sections.length; i++) {
        const value = sectionValues[i];
        const section = sections[i];
        if (section.type === "text") {
            const error = textSectionError(value, section);
            if (error) return error;
        }
    }

    return "";
}

function textSectionError(value: any, section: ITextSection) {
    const { error } = Joi.string().allow("").validate(value);
    if (error) return error.message;

    const stringValue = value as string;
    if (!section.multiline) {
        const hasNewLineCharacters = stringValue.match("\n");
        if (hasNewLineCharacters) {
            return "Single line fields cannot have multiline characters";
        }
    }

    return "";
}
