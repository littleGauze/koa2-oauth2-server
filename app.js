const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const mount = require('koa-mount')
// const model = require('oauth2-server/examples/memory/model.js')
const convert = require('koa-convert')
const mongoose = require('mongoose')
const render = require('koa-ejs')
const path = require('path')
const url = require('url')

const OauthServer = require('./src/middleware/oauth2')
const mongo = require('./src/middleware/mongo')
const model = require('./src/model')

const app = new Koa()
render(app, {
  root: path.resolve(__dirname, './src/view'),
})

const conn = mongoose.createConnection('mongodb://localhost:27017/test', function(err) {
  if (err) {
    console.error('mongodb connect error', err);
  }
})

const oauth = new OauthServer({
  model: model(conn), // See https://github.com/thomseddon/node-oauth2-server for specification
  allowBearerTokensInQueryString: true
})

app.use(bodyParser())
app.use(mongo())

const router = new Router()
app.use(mount('/oauth2', router.middleware()))

// show the user authorize page
router.get('/show', async (ctx) => {
  await ctx.render('authorize', { query: ctx.query })
})

// authorize
router.get('/authorize', async (ctx, next) => {
  const { username, password } = ctx.query
  if (!username || !password) {
    const search = new url.URLSearchParams(ctx.request.query)
    return ctx.redirect(`/oauth2/show?${search.toString()}`)
  }
  await next()
}, oauth.authorize({
  authenticateHandler: {
    handle (req, res) {
      return { id: 'nealli1234' }
    }
  }
}))

// get access token
router.post('/token', oauth.token())

// token callback test
router.get('/callback', async (ctx, next) => {
  ctx.body = ctx.request.query
})

const route = new Router()
app.use(mount('/jnbapi', route.middleware()))

// authenticate and get the userinfo
route.get('/user/info', oauth.authenticate(), async (ctx) => {
  ctx.body = {
    oauth: ctx.req.oauth
  }
})

app.listen(3000)
