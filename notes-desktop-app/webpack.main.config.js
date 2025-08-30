const path = require('path');

module.exports = {
  target: 'electron-main',
  entry: {
    main: './src/main/main.ts',
    preload: './src/preload/preload.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.main.json')
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
  node: {
    __dirname: false,
    __filename: false,
  },
};