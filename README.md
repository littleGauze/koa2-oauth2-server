# koa2-oauth2-server
This project is a demo for OAuth2-server package usage with grant_type of `authorization_code`

## Quick Start
- I use the mongodb for the oauth2-server model, so you should run a local mongodb server first. 
- And then create a database (I use the name of test).
- Add a client document to `oauthclients` collection like below:
  ```js
  { 
    "_id" : ObjectId("5d0904b86ead30545165865d"), 
    "clientId" : "clientid123", 
    "clientSecret" : "clientsecret123", 
    "grants" : [
        "authorization_code", 
        "refresh_token"
    ], 
    "redirectUris" : [
        "http://localhost:3001/authCallback"
    ]
  }
  ```
  > more collection name see [here](https://github.com/littleGauze/koa2-oauth2-server/blob/master/src/model.js)
  
 - start the client and oauth2 server
   - install `yarn` or `npm init`
   - client `yarn client` or `npm run client`
   - server `yarn start` or `npm start`
 
## Documentation
- [oauth2-server](https://oauth2-server.readthedocs.io/en/latest/index.html)
- package `npm install oauth2-server`
- The OAuth 2.0 Authorization Framework [rfc6749](https://tools.ietf.org/html/rfc6749.html)

### Demo
<img src="https://github.com/littleGauze/koa2-oauth2-server/blob/master/doc/oauth2-1.png" width="200">
<img src="https://github.com/littleGauze/koa2-oauth2-server/blob/master/doc/oauth2-2.png" width="200">
<img src="https://github.com/littleGauze/koa2-oauth2-server/blob/master/doc/oauth2-3.png" width="200">
