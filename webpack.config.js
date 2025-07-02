const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: './index.web.js',
    output: {
        path: path.resolve(__dirname, 'web-build'),
        filename: 'bundle.web.js'
    },
    resolve: {
        extensions: ['.web.js','.js','.tsx','.ts'],
        alias: { 'react-native$': 'react-native-web' }
    },
    module: {
        rules: [{
            test: /\.[jt]sx?$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: { presets: ['module:metro-react-native-babel-preset'] }
            }
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({ template: 'public/index.html' })
    ],
    devServer: {
        static: 'public',
        port: 8081,
        historyApiFallback: true
    },
    mode: 'development'
};
