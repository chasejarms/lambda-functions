import { isArray } from "lodash";
import { ITicketTemplateCreateRequest } from "../../models/requests/ticketTemplateCreateRequest";

export function ticketTemplateCreateRequestErrorMessage(
    ticketTemplate: ITicketTemplateCreateRequest
): string {
    const ticketTemplateIsNotObject = typeof ticketTemplate !== "object";
    if (ticketTemplateIsNotObject) {
        return "The ticket template must be an object";
    }

    const requiredKeys: {
        [key: string]: true;
    } = {
        name: true,
        description: true,
        title: true,
        sections: true,
        summary: true,
    };
    const allKeysAreValid = Object.keys(ticketTemplate).every(
        (key) => requiredKeys[key]
    );
    if (!allKeysAreValid) {
        const allowedKeysString = Object.keys(requiredKeys).join(", ");
        return `The allowed keys are: ${allowedKeysString}`;
    }

    // validate name

    const nameIsNotAString = typeof ticketTemplate.name !== "string";
    if (nameIsNotAString) {
        return "The name must be a string";
    }

    // validate description

    const descriptionIsNotAString =
        typeof ticketTemplate.description !== "string";
    if (descriptionIsNotAString) {
        return "The description must be a string";
    }

    // validate title

    const titleIsMissingLabel = !ticketTemplate.title.label;
    if (titleIsMissingLabel) {
        return "The title is missing a label";
    }

    const titleLabelIsNotString =
        typeof ticketTemplate.title.label !== "string";
    if (titleLabelIsNotString) {
        return "The title label is not a string";
    }

    // validate summary

    const summaryIsMissingLabel = !ticketTemplate.summary.label;
    if (summaryIsMissingLabel) {
        return "The summary is missing a label";
    }

    const summaryLabelIsNotString =
        typeof ticketTemplate.summary.label !== "string";
    if (summaryLabelIsNotString) {
        return "The summary label is not a string";
    }

    const summaryIsRequiredIsMissing =
        ticketTemplate.summary.isRequired === undefined;
    if (summaryIsRequiredIsMissing) {
        return "The summary isRequired field is missing";
    }

    const summaryIsRequiredFieldIsNotBoolean =
        typeof ticketTemplate.summary.isRequired !== "boolean";
    if (summaryIsRequiredFieldIsNotBoolean) {
        return "The summary is required field is not a boolean";
    }

    // validate sections

    const sectionsIsNotArray = !isArray(ticketTemplate.sections);
    if (sectionsIsNotArray) {
        return "The sections field is not an array";
    }

    return "";
}
