var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
  target: 'node',
  entry: {
    server: './src/server/server.js',
    client: './src/client/client.js'
  },
  output: {
    path: './dist',
    filename: '[name].js',
    libraryTarget: 'commonjs'
  },
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'babel-loader?presets[]=es2015!ts-loader' },
      { test: /\.md$/, loader: 'ignore-loader' },
      { test: /LICENSE$/, loader: 'ignore-loader' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  externals: [
    /^(?!\.|\/).+/i,
  ],
  plugins: [    
    new HtmlWebpackPlugin ({
      inject: true,
      chunks: ['client'],
      template: './src/client/main.html',
      filename: 'index.html'
    })
  ]
}