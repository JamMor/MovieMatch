// webpack.config.js
const path = require('path');
const {getDjangoEntrypointBundles} = require('./webpack.config.utils.js');

const outputDir = path.resolve(__dirname, 'dist')

const collectStaticDir = 'staticfiles'
const projectStaticDir = path.join(__dirname, 'movie_match', 'static', 'js');
const sharedDir = path.join(projectStaticDir, 'shared');

// Django apps to bundle
const installed_apps = [
    "login_and_reg",
    "list_builder",
    "elimination_room",
]

// Common JS to be added to every bundle
const commonJsDirs = [
    path.join(projectStaticDir, 'base'), // Base template JS
]

//Build DJango app's static JS paths
const appJsDirs = installed_apps.map(app => path.join(__dirname, app, 'static', app, 'js'))

module.exports = {
    mode: 'development',
    entry: getDjangoEntrypointBundles(appJsDirs, commonJsDirs),
    resolve: {
        alias: {
            "/static/js/shared": path.resolve(__dirname, sharedDir)
        },
    },
    output: {
        filename: '[name]/main.bundle.js',
        path: outputDir,
    }
};