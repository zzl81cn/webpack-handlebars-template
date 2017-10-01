const config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

const opn = require('opn')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const proxyMiddleware = require('http-proxy-middleware')
const webpackConfig = process.env.NODE_ENV === 'testing' ? require(
  './webpack.prod.conf') : require('./webpack.dev.conf')

const port = process.env.PORT || config.dev.port
const autoOpenBrowser = !!config.dev.autoOpenBrowser
const proxyTable = config.dev.proxyTable

const app = express()
const complier = webpack(webpackConfig)

const devMiddleware = require('webpack-dev-middleware')(complier, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true,
  noInfo: false
})
const hotMiddleware = require('webpack-hot-middleware')(complier, {
  log: () => console.log,
  heartbeat: 2000
})

complier.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({action: 'reloadd'})
    cb()
  })
})
Object.keys(proxyTable).forEach(function (context) {
  const options = proxyTable[context]
  if (typeof options === 'string') {
    options = {target: options}
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

app.use(require('connect-history-api-fallback')())
app.use(devMiddleware)
app.use(hotMiddleware)

const staticPath = path.posix.join(config.dev.assetsPublicPath,
  config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))

const uri = 'http://localhost:' + port

let _resolve
const readyPromise = new Promise(resolve => {
  _resolve = resolve
})
console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  if (autoOpenBrowser && process.env.NODE_ENV !== 'test') {
    opn(uri)
  }
  _resolve()
})

const server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
