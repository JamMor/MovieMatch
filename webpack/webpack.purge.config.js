const { merge } = require('webpack-merge');
const development = require('./webpack.dev.config.js');
const PurgeCSSWriterPlugin = require('./purgecss.wrapperclass.js');
const { getFilePaths } = require('./webpack.config.utils.js');
const djangoPaths = require('./webpack.djangopaths.js');

const allStaticDirectories = djangoPaths.getAllStaticDirectories();
const allTemplateDirectories = djangoPaths.getAllTemplateDirectories();

const contentPaths = []
allStaticDirectories.forEach((dir) => {
    contentPaths.push(...getFilePaths(dir, ['*.js'], '**/vendor/**'))
})
allTemplateDirectories.forEach((dir) => {
    contentPaths.push(...getFilePaths(dir, ['*.html'], '**/vendor/**'))
})

const vendorCSSDir = djangoPaths.vendorStaticDirs.css
const vendorCSSPaths = getFilePaths(vendorCSSDir, ['*.css'], '**/*.min.css')

const purgedCSSOutputPath = djangoPaths.outputToWebpackDir('purged-css.json')

module.exports = merge(development, {
    entry: {
        'vendor': vendorCSSPaths,
    },
    plugins: [
        new PurgeCSSWriterPlugin({
            output: purgedCSSOutputPath,
            paths: contentPaths,
            rejected: true,
            rejectedCss: true,
            safelist: [],
        }),
    ],
});