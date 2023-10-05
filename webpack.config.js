// webpack.config.js
const path = require('path');
const glob = require('glob');

const srcDir = 'staticfiles'
const relSrcDir = `./${srcDir}`;

module.exports = {
    mode: 'development',
    entry: () => {
        const entryPoints = {};
        const indexFiles = glob.sync(
            `${relSrcDir}/**/index.js`,
            {
                posix: true,
                dotRelative: true,
                ignore: 'bundled_assets/**',
                windowsPathsNoEscape: true
            }
        );

        indexFiles.forEach((file) => {
            const entryName = path.dirname(file).replace('./staticfiles/', '');
            entryPoints[entryName] = file;
        });

        return entryPoints;
    },
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