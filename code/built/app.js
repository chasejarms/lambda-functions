"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpHandler = void 0;
const signUpHandler = async (event) => {
    const queries = JSON.stringify(event.queryStringParameters);
    return {
        statusCode: 200,
        body: `Queries: ${queries}`,
    };
};
exports.signUpHandler = signUpHandler;
//# sourceMappingURL=app.js.map