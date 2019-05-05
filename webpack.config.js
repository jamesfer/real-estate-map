const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve('src', 'attempt-3', 'index.ts'),
  output: {
    path: path.resolve('src', 'attempt-3', 'dist'),
    filename: 'bundle.js',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.jsx', '.css']
  },
  module: {
    rules: [
      {
        test: /\.worker\.tsx?/,
        include: [
          path.resolve('src', 'attempt-3'),
          path.resolve('src', 'real-estate-api'),
        ],
        use: [
          'file-loader',
        ]
      },
      {
        test: /\.tsx?/,
        include: [
          path.resolve('src', 'attempt-3'),
          path.resolve('src', 'real-estate-api'),
        ],
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
      template: require('html-webpack-template'),
      appMountId: 'map',
      scripts: [
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyC3pGR5GoIrUAALkjshqD6JoWgmatm7wm8',
      ],
    }),
  ],
};
