const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
		'app':  path.resolve(__dirname, 'js/index.js'),
		'worker': path.resolve(__dirname,'js/worker.js')
	},
    output: {
        path: path.resolve(__dirname, 'public/dist'),
        filename: '[name]/bundle.js'
    },
    optimization: {
        minimize: false
    },
	plugins: [
		new NodePolyfillPlugin()
	]
};
