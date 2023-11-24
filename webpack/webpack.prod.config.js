const { merge } = require('webpack-merge');
const common = require('./webpack.config.js');
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: ['log','info','warn'],
                        top_retain: null,
                    },
                    mangle: {
                        module: true,
                        reserved: [],
                    },
                    module: true,
                    sourceMap: true,
                },
            }),
            new CssMinimizerPlugin({
                test: /\.css$/i,
            }),
        ],
    }
});