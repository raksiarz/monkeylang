const path = require('path')

module.exports = {
    entry: './exports.ts',
    target: ['web', 'es6'],
    experiments: {
        outputModule: true,
    },
    output: {
        library: {
            type: "module",
        },
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