const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './pbac.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'pbac.js',
    library: 'pbac',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BROWSER': JSON.stringify(true),
    }),
  ],
  externals: {
    'ip-range-check': 'ip-range-check',
    lodash: 'lodash',
    'lodash/fp': 'lodash/fp',
    'z-schema': 'z-schema',
  },
};
