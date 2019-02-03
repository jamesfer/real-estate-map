const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve('src', 'optimized-visualization-2', 'initMap.ts'),
  output: {
    path: path.resolve('src', 'optimized-visualization-2', 'dist'),
    filename: 'bundle.js',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.jsx', '.css']
  },
  devServer: {
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?/,
        include: [
          path.resolve('src', 'optimized-visualization-2'),
        ],
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.json',
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
