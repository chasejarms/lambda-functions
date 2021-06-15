const path = require("path");
const glob = require("glob");

module.exports = {
    entry: "./src/functions/index.ts",
    output: {
        filename: "app.js",
        path: path.resolve(__dirname, "built"),
        clean: true,
        libraryTarget: "umd",
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
    target: "node",
    mode: "production",
    optimization: { minimize: false },
};
