const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/server/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'server/index.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.server.json')
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  externals: {
    // 排除node_modules，让它们在运行时解析
    // 这对于Koa和其他Node.js模块很重要
  },
  node: {
    // 保持node环境的变量
    __dirname: false,
    __filename: false,
  },
  mode: 'development',
  devtool: 'source-map'
};