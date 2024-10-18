const path = require('path')

module.exports = {
    entry: './exports.js',
    target: ['web', 'es6'],
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, './')
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                use: "babel-loader",
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
}