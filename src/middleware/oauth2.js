
const NodeOAuthServer = require('oauth2-server')

class OAuthServer {
  constructor (opts) {
    this.server = new NodeOAuthServer(opts)
    this.apis = ['authenticate', 'authorize', 'token']
    this.init()
  }

  init () {
    this.apis.forEach(method => {
      this[method] = opt => async (ctx, next) => {
        const fn = promisify(this.server[method].bind(this.server))
        const req = new NodeOAuthServer.Request(ctx.request)
        const res = new NodeOAuthServer.Response(ctx.response)

        try {
          const result = await fn(req, res, opt) || {}
          if (method === 'authenticate') {
            ctx.req.oauth = result
          }
          ctx.status = res.status
          ctx.body = res.body
          await next()
        } catch (err) {
          ctx.status = err.status
          ctx.body = {
            error: err.name,
            message: err.message
          }
        } finally {
          ctx.set(res.headers)
        }
      }
    })
  }
}

function promisify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }
}

module.exports = OAuthServer
