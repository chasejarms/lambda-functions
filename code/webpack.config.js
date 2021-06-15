const path = require("path");

module.exports = {
    entry: "./src/app.ts",
    mode: "production",
    target: "node",
    output: {
        filename: "app.js",
        path: path.resolve(__dirname, "built"),
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
};
