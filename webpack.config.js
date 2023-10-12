// webpack.config.js
const path = require('path');
const {getDjangoEntrypointBundles} = require('./webpack.config.utils.js');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// Output directory
const outputDir = path.resolve(__dirname, 'dist')

// Project wide static directory
const projectStaticDir = path.join(__dirname, 'movie_match', 'static');

// JS modules shared across several apps are kept in the Project static directory.
// Other modules import them using their Django static URL, which must be aliased
// to the shared directory for webpack to find them.
const sharedJsDir = path.join(projectStaticDir, 'js', 'shared');
const sharedJsUrl = '/static/js/shared';

// Django apps to bundle
const installed_apps = [
    "login_and_reg",
    "list_builder",
    "elimination_room",
]
const appStaticPath = (appName) => path.join(__dirname, appName, 'static', appName)

const staticDirectories = installed_apps.map(appStaticPath)
staticDirectories.push(projectStaticDir)

module.exports = {
    mode: 'development',
    entry: getDjangoEntrypointBundles(staticDirectories),
    resolve: {
        alias: {
            [sharedJsUrl]: path.resolve(__dirname, sharedJsDir)
        },
    },
    output: {
        filename: '[name]/main.bundle.js',
        path: outputDir,
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