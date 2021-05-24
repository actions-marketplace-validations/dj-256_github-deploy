const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/index.js',

    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },

    target: 'node',

    resolve: {
        modules: [
            'node_modules'
        ],
        fallback: {
            'fs':false,
            "dns":false,
            "net":false,
            "child_process":false,
        },
    },
};
