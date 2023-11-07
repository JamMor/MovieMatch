const { merge } = require('webpack-merge');
const production = require('./webpack.prod.config.js');

module.exports = merge(production, {
    devtool: false,
});