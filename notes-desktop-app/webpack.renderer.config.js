const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web', // 修改为 web，因为我们在 electron 渲染进程中运行
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'bundle.js',
    publicPath: './',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.renderer.json')
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    fallback: {
      "path": false,
      "fs": false,
      "crypto": false,
      "buffer": false,
      "stream": false,
      "util": false,
      "url": false,
      "querystring": false,
      "http": false,
      "https": false,
      "assert": false,
      "os": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      inject: 'body'
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
  },
  node: {
    __dirname: false,
    __filename: false
  }
};