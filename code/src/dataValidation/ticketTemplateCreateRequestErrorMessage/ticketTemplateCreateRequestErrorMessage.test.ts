import {
    ticketTemplateCreateRequestErrorMessage,
    ticketTemplateCreateRequestErrorMessageMapping,
} from ".";

describe("ticketTemplateCreateRequestErrorMessage", () => {
    describe("the name is not provided", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage(
                {} as any
            );
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.nameIsRequired
            );
        });
    });

    describe("the name is an empty string", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "",
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.nameIsRequired
            );
        });
    });

    describe("the description is not provided", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.descriptionIsRequired
            );
        });
    });

    describe("the description is an empty string", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
                description: "",
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.descriptionIsRequired
            );
        });
    });

    describe("the title is not provided", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
                description: "This is the description",
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.titleIsRequired
            );
        });
    });

    describe("the title is an empty string", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
                description: "This is the description",
                title: {
                    label: "",
                },
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.titleIsRequired
            );
        });
    });

    describe("the summary is not provided", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
                description: "This is the description",
                title: {
                    label: "Title",
                },
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.summaryIsRequired
            );
        });
    });

    describe("the summary is an empty string", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
                description: "This is the description",
                title: {
                    label: "Title",
                },
                summary: {
                    label: "",
                },
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.summaryIsRequired
            );
        });
    });

    describe("the sections list is not provided", () => {
        it("should return the correct error message", () => {
            const errorMessage = ticketTemplateCreateRequestErrorMessage({
                name: "Development",
                description: "This is the description",
                title: {
                    label: "Title",
                },
                summary: {
                    label: "Summary",
                },
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.sectionsIsRequired
            );
        });
    });
});
