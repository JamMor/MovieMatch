// webpack.config.js
const path = require('path');
const {getDjangoJSEntryPoints} = require('./webpack.config.utils.js');

const srcDir = 'staticfiles'
const relSrcDir = `./${srcDir}`;

module.exports = {
    mode: 'development',
    entry: getDjangoJSEntryPoints(relSrcDir),
    resolve: {
        alias: {
            "/static/js": path.resolve(relSrcDir, 'js'),
        },
    },
    output: {
        filename: '[name]/main.bundle.js',
        path: path.resolve(__dirname, 'staticfiles', 'bundled_assets'),
    }
};