const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './pbac.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'pbac.js',
    library: 'PBAC',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BROWSER': JSON.stringify(true),
    }),
  ],
  externals: {
    'ipaddr.js': {
      root: 'ipaddr',
      commonjs: 'ipaddr.js',
      commonjs2: 'ipaddr.js',
      amd: 'ipaddr.js',
    },
    'lodash/fp': {
      root: '_',
      commonjs: 'lodash/fp',
      commonjs2: 'lodash/fp',
      amd: 'lodash/fp',
    },
    'z-schema': 'z-schema',
  },
};
