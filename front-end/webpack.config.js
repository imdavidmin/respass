
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = () => {
    return {
        mode: "development",
        entry: "./src/index.tsx",
        devtool: "source-map",
        resolve: {
            extensions: [".ts", ".tsx", ".js"]
        },
        output: {
            publicPath: "/",
            path: path.resolve(__dirname, "build"),
            filename: "bundled.js"
        },
        module: {
            rules: [
                {
                    test: /\.(ts|tsx)$/,
                    loader: "ts-loader"
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./public/index.html"
            }),
        ]
    }
};