// webpack.config.js
module.exports = {
  entry: {
    index: __dirname + '/src/index.js',
    background: __dirname + '/src/background.js',
    options: __dirname + '/src/options.js',
    keymap: __dirname + '/src/keymap.js'
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name].bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {test: /\.css$/, loader: 'style!css?sourceMap'},
      {test: /\.json$/, loader: 'json-loader'},

      // WebFontのbase64エンコード
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" }
    ]
  }
};
