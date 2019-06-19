const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const render = require('koa-ejs')
const path = require('path')
const url = require('url')
const axios = require('axios')
const querystring = require('querystring')

const redirect_uri = 'http://localhost:3001/authCallback'
const client_id = 'clientid123'
const client_secret = 'clientsecret123'

const app = new Koa()

const request = axios.create({
  baseURL: 'http://localhost:3000/'
})

render(app, {
  root: path.resolve(__dirname, './src/view'),
  layout: 'layout1'
})

const router = new Router()
app.use(bodyParser())
app.use(router.routes())

router.get('/login', async (ctx) => {
  await ctx.render('login', {
    query: {
      response_type: 'code',
      client_id,
      redirect_uri,
      state: 's=helllo'
    }
  })
})

router.get('/authCallback', async (ctx) => {
  const { code, state } = ctx.query

  // get the access_token
  let res
  try {
    res = await request.post('oauth2/token', querystring.stringify({
      code,
      redirect_uri,
      client_id,
      client_secret,
      grant_type: 'authorization_code'
    }))
  } catch (err) {
    ctx.body = err.response.data
    return
  }

  await ctx.render('callback', { data: res.data })
})

app.listen(3001)
