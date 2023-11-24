const path = require('path');
const {getDjangoEntrypointBundles} = require('./webpack.config.utils.js');
const djangoPaths = require('./webpack.djangopaths.js');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Output directory
const outputDirectory = path.resolve(djangoPaths.projectRoot, 'dist')

// All static directories to bundle
const staticDirectories = djangoPaths.getAllStaticDirectories()

module.exports = {
    mode: 'development',
    entry: getDjangoEntrypointBundles(staticDirectories, ["index.js", "*.css"], '**/vendor/**'),
    resolve: {
        alias: {
            [djangoPaths.sharedJsUrl]: djangoPaths.sharedJsDir
        },
    },
    output: {
        filename: '[name]/main.bundle.js',
        path: outputDirectory,
        clean: true,
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name]/styles.bundle.css',
        }),
    ],
};