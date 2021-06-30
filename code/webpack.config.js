const path = require("path");
const glob = require("glob");

module.exports = {
    entry: glob.sync("./src/lambdas/**/index.ts").reduce((acc, path) => {
        const pathSplitOnBackslashes = path.split("/");
        const secondToLastIndex = pathSplitOnBackslashes.length - 2;
        const fileName = pathSplitOnBackslashes[secondToLastIndex];
        acc[fileName] = path;
        return acc;
    }, {}),
    output: {
        filename: "./[name]/index.js",
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
    externals: {
        "aws-sdk": "aws-sdk",
    },
};
