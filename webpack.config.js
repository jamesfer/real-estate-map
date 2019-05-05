const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTemplate = require('html-webpack-template');

module.exports = {
  mode: 'development',
  entry: path.resolve('src', 'attempt-3', 'index.ts'),
  output: {
    path: path.resolve('dist'),
    filename: 'bundle.js',
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
              configFile: 'tsconfig.json',
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
      inject: false,
      template: HtmlWebpackTemplate,
      title: 'Property map',
      appMountId: 'map',
      scripts: [
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyC3pGR5GoIrUAALkjshqD6JoWgmatm7wm8',
      ],
    }),
  ],
};
