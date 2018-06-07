const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


module.exports = {
	entry: './src/index.js',
	
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.HotModuleReplacementPlugin(),
        new BundleAnalyzerPlugin(),
	],
	
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist')
	},
	
	module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['react', 'es2015'],
                    plugins: ['add-module-exports']
                }
            },
            {
                test: /\.css$/,
                loaders: [
                    'style', 'css',
                ]
            },
			{
				test: /^(?!.*?\.module).*\.css$/,
				use: [
					'style-loader',
					'css-loader'
				]
			},
			{
				test: /\.module/.css$,
				use: ['style-loader', {
					loader: 'css-loader',
					options: {
						modules: true
					}
				}]
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