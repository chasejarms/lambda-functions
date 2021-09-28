import {
    ticketTemplateCreateRequestErrorMessage,
    ticketTemplateCreateRequestErrorMessageMapping,
} from ".";
import { Color } from "../../models/database/color";

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
                ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
            );
        });
    });

    describe("the section is an invalid type", () => {
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
                sections: [
                    {
                        type: "not-valid",
                    },
                ],
            } as any);
            expect(errorMessage).toBe(
                ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
            );
        });
    });

    describe("text section", () => {
        describe("a label is not provided", () => {
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
                    sections: [
                        {
                            type: "text",
                            multiline: false,
                            required: false,
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("the label is an empty string", () => {
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
                    sections: [
                        {
                            type: "text",
                            label: "",
                            multiline: false,
                            required: false,
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("multiline is not provided", () => {
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
                    sections: [
                        {
                            type: "text",
                            label: "Label",
                            required: false,
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("required is not provided", () => {
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
                    sections: [
                        {
                            type: "text",
                            label: "Label",
                            multiline: false,
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });
    });

    describe("number section", () => {
        describe("a label is not provided", () => {
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
                    sections: [
                        {
                            type: "number",
                            required: true,
                            minValue: 0,
                            maxValue: 1,
                            allowOnlyIntegers: false,
                            alias: "hello",
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("the label is an empty string", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "",
                            required: true,
                            minValue: 0,
                            maxValue: 1,
                            allowOnlyIntegers: false,
                            alias: "hello",
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("required is not provided", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            minValue: 0,
                            maxValue: 1,
                            allowOnlyIntegers: false,
                            alias: "hello",
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("allowOnlyIntegers is not provided", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "hello",
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("the min is greater than the max", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 1,
                            maxValue: 0,
                            alias: "hello",
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });

        describe("the minValue is undefined but the max value is set", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: undefined,
                            maxValue: 0,
                            alias: "hello",
                        },
                    ],
                    priorityWeightingCalculation: "",
                } as any);
                expect(errorMessage).toBe("");
            });
        });

        describe("the maxValue is undefined but the min value is set", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: undefined,
                            alias: "hello",
                        },
                    ],
                    priorityWeightingCalculation: "",
                } as any);
                expect(errorMessage).toBe("");
            });
        });

        describe("the minValue is less than the maxValue", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "hello",
                        },
                    ],
                    priorityWeightingCalculation: "",
                } as any);
                expect(errorMessage).toBe("");
            });
        });

        describe("the alias uses invalid characters", () => {
            it("should return the correct error", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "abc1",
                        },
                    ],
                    priorityWeightingCalculation: "",
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.sectionsIsInvalid
                );
            });
        });
    });

    describe("priorityWeightingCalculation", () => {
        describe("the calculation is not provided", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "hello",
                        },
                    ],
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.priorityWeightingCalculation
                );
            });
        });

        describe("the calculation is an empty string", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "hello",
                        },
                    ],
                    priorityWeightingCalculation: "",
                } as any);
                expect(errorMessage).toBe("");
            });
        });

        describe("the calculation has invalid characters", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "",
                        },
                    ],
                    priorityWeightingCalculation: "hello % goodbye",
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.priorityWeightingCalculation
                );
            });
        });
    });

    describe("color", () => {
        describe("a color is not provided", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "",
                        },
                    ],
                    priorityWeightingCalculation: "",
                } as any);
                expect(errorMessage).toBe("");
            });
        });

        describe("an invalid color is provided", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "",
                        },
                    ],
                    priorityWeightingCalculation: "",
                    color: "not-a-color",
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.colorError
                );
            });
        });

        describe("a valid color is provided", () => {
            it("should return an empty string", () => {
                const errorMessage = ticketTemplateCreateRequestErrorMessage({
                    name: "Development",
                    description: "This is the description",
                    title: {
                        label: "Title",
                    },
                    summary: {
                        label: "Summary",
                    },
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "",
                        },
                    ],
                    priorityWeightingCalculation: "",
                    color: Color.Blue,
                } as any);
                expect(errorMessage).toBe("");
            });
        });
    });

    describe("aliases & priority weighting calculation", () => {
        describe("the priority weighting calculation uses an invalid alias", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "abc",
                        },
                    ],
                    priorityWeightingCalculation: "abcd",
                    color: Color.Blue,
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.calculationError
                );
            });
        });

        describe("an alias is duplicated", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "abc",
                        },
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "abc",
                        },
                    ],
                    priorityWeightingCalculation: "",
                    color: Color.Blue,
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.duplicateAlias
                );
            });
        });

        describe("the calculation function is not set up correctly", () => {
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
                    sections: [
                        {
                            type: "number",
                            label: "Label",
                            allowOnlyIntegers: true,
                            required: false,
                            minValue: 0,
                            maxValue: 1,
                            alias: "abc",
                        },
                    ],
                    priorityWeightingCalculation: "abc * abc *",
                    color: Color.Blue,
                } as any);
                expect(errorMessage).toBe(
                    ticketTemplateCreateRequestErrorMessageMapping.calculationError
                );
            });
        });
    });
});
