module.exports = {
  entry: './src/index.js',
  mode: 'development',
  devtool: 'inline-source-map',

  devServer: {
    contentBase: './dist',
    compress: true,
    port: 9000,
    host: '0.0.0.0'  // This is needed if you want others on the same network to be able to connect.
  }
}
