module.exports = {
  mode: 'production',
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
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    ]
  }
};
