const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: './src/index.js',
	
	plugins: [
		new webpack.HotModuleReplacementPlugin()
	],
	
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	
	module: {
		
		loaders: [
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
				query: {
					presets: ['react', 'es2015']
				}
			}
		],
		
		rules: [
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.(png|svg|jpg|gif)$/,
				use: [
					'file-loader'
				]
			}
		]		
	},
	
	devServer: {
		hot: true,
		contentBase: path.resolve(__dirname, 'dist'),
		publicPath: '/'
	}
};