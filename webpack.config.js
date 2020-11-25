const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTemplate = require('html-webpack-template');

module.exports = {
  mode: 'development',
  target: 'web',
  entry: path.resolve('src', 'ui', 'index.ts'),
  output: {
    path: path.resolve('build', 'ui'),
    filename: '[name].[contenthash].js',
  },
  optimization: {
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.jsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.ui.json',
            },
          },
        ]
      },
      {
        test: /\.css/,
        use: [
          'style-loader',
          'css-loader',
        ],
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: HtmlWebpackTemplate,
      title: 'Property map',
      appMountId: 'map',
      scripts: [
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyC3pGR5GoIrUAALkjshqD6JoWgmatm7wm8',
      ],
    }),
  ],
};
