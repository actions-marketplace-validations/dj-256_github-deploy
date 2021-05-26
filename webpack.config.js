const path = require('path');

module.exports = {
    mode: 'production',
    entry: './dist/index.js',

    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'out'),
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
