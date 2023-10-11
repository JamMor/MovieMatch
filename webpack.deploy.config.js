const { merge } = require('webpack-merge');
const common = require('./webpack.prod.config.js');

module.exports = merge(common, {
    mode: 'production',
    devtool: false,
});