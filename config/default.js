'use strict';

var path = require('path');
var webpack = require('webpack');

module.exports = {
  redis: {
    host: '127.0.0.1',
    port: 6379
  },

  stripe: {
      publicKey: 'pk_test_JX0R24WmahC1qH6yPRFR6Tjb',
      secretKey: 'sk_test_PuFGJGdJD5dhcsnqopn0p2pv'
  },

  google: {
      serviceAccount: '555184822066-f48i274j6tsj4pl8gs06isua0cb91q7a@developer.gserviceaccount.com',
      email: 'admin@trainify.io',
      password: 'NpRzkTRoxih]me[fj#caqKXcsD]]Ld}(h'
  },

  server: {
    port: 6158,
    session: 'SomeTHINGRand0m',
    pass: 'R{ZFBAh$=q/YYYTh@Vekc%PDLibv]yaYjzh'
  },

  mandrill: 'QhbawI-EVGiLprizwN3i0A',

  db: {
    port: 5432,
    host: '127.0.0.1',
    name: 'sosick',
    user: 'sosickstudios',
    password: 'b)ncpmHrgZGibtJ(uR'
  },

  webpack: {
    cache: true,
    entry: {
        'main': [
            'webpack-dev-server/client?http://0.0.0.0:8080',
            'webpack/hot/only-dev-server',
            './app/flux/main'
        ]
    },
    output: {
        path: path.resolve(path.join(__dirname, '/../app/scripts/')),
        pathInfo: true,
        publicPath: 'http://localhost:8080/',
        filename: '[name].js',
        chunkFilename: '[chunkhash].js'
    },
    module: {
        loaders: [
            // required for react jsx
            { test: /\.js$/, loaders: ['babel?stage=0'], exclude: /node_modules/,
              include: path.resolve(path.join(__dirname, '/../app/flux')) },

            { test: /\.jsx$/, loaders: ['react-hot', 'babel?stage=0'], exclude: /node_modules/,
                include: path.resolve(path.join(__dirname, '/../app/flux')) }
        ]
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin()
    ]
  }
};
