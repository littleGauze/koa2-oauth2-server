/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

//
// Schemas definitions
//
var OAuthAuthorizationCodesSchema = new Schema({
  authorizationCode: { type: String },
  client: { id: String },
  user: { id: String },
  expiresAt: { type: Date },
  scope: { type: String },
  redirectUri: { type: String }
});

var OAuthAccessTokensSchema = new Schema({
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  client: { id: String },
  user: { id: String },
  scope: { type: String }
});

var OAuthRefreshTokensSchema = new Schema({
  refreshToken: { type: String },
  refreshTokenExpiresAt: { type: Date },
  client: { id: String },
  user: { id: String },
  scope: { type: String }
});

var OAuthClientsSchema = new Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  redirectUris: [ String ],
  grants: [ String ],
  accessTokenLifetime: { type: Date },
  refreshTokenLifetime: { type: Date }
});

var OAuthUsersSchema = new Schema({
  username: { type: String },
  password: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String, default: '' }
});

module.exports = mongo => {
  var model = {}
  mongo.model('OAuthAccessTokens', OAuthAccessTokensSchema);
  mongo.model('OAuthRefreshTokens', OAuthRefreshTokensSchema);
  mongo.model('OAuthClients', OAuthClientsSchema);
  mongo.model('OAuthUsers', OAuthUsersSchema);
  mongo.model('OAuthAuthorizationCodes', OAuthAuthorizationCodesSchema);

  var OAuthAccessTokensModel = mongo.model('OAuthAccessTokens'),
    OAuthRefreshTokensModel = mongo.model('OAuthRefreshTokens'),
    OAuthClientsModel = mongo.model('OAuthClients'),
    OAuthAuthorizationCodesModel = mongo.model('OAuthAuthorizationCodes'),
    OAuthUsersModel = mongo.model('OAuthUsers');

  //
  // oauth2-server callbacks
  //
  model.getAccessToken = function (bearerToken, callback) {
    console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

    OAuthAccessTokensModel.findOne({ accessToken: bearerToken }, callback);
  };

  model.getClient = function (clientId, clientSecret, callback) {
    console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
    if (clientSecret === null) {
      return OAuthClientsModel.findOne({ clientId: clientId }, callback);
    }
    OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }, callback);
  };

  model.getAuthorizationCode = function (code, cb) {
    OAuthAuthorizationCodesModel.findOne({ authorizationCode: code }).then(res => cb(null, res)).catch(cb)
  }

  model.revokeAuthorizationCode = function (code, cb) {
    OAuthAuthorizationCodesModel.deleteOne({ authorizationCode: code.authorizationCode }).then(res => cb(null, res)).catch(cb)
  }

  model.revokeToken = function (token, cb) {
    OAuthRefreshTokensModel.deleteOne({ refreshToken: token.refreshToken }).then(res => cb(null, res)).catch(cb)
  }

  model.saveAuthorizationCode = function (code, client, user, cb) {
    const authCode = new OAuthAuthorizationCodesModel({
      user: { id: user.id },
      client: { id: client.id },
      expiresAt: code.expiresAt,
      authorizationCode: code.authorizationCode,
      redirectUri: code.redirectUri,
      scope: code.scope,
    })
    return authCode.save(cb)
  }

  // This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
  // it gives an example of how to use the method to resrict certain grant types
  var authorizedClientIds = ['s6BhdRkqt3', 'toto'];
  model.grantTypeAllowed = function (clientId, grantType, callback) {
    console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

    if (grantType === 'password') {
      return callback(false, authorizedClientIds.indexOf(clientId) >= 0);
    }

    callback(false, true);
  };

  model.saveToken = function (token, client, user, callback) {
    console.log('in saveAccessToken (token: ' + token + ', clientId: ' + client.id + ', userId: ' + user.id + ', expires: ' + token.accessTokenExpiresAt + ')');

    const common = {
      client: { id: client.id },
      user: { id: user.id },
      scope: token.scope
    }

    var accessToken = new OAuthAccessTokensModel(Object.assign({
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt
    }, common));

    var refreshToken = new OAuthRefreshTokensModel(Object.assign({
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt
    }, common))

    Promise.all([accessToken.save(), refreshToken.save()]).then(([token, refresh]) => {
      callback(null, {
        scope: token.scope,
        user: token.user,
        client: token.client,
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: refresh.refreshToken,
        refreshTokenExpiresAt: refresh.refreshTokenExpiresAt
      })
    }).catch(callback);
  };

  /*
  * Required to support password grant type
  */
  model.getUser = function (username, password, callback) {
    console.log('in getUser (username: ' + username + ', password: ' + password + ')');

    OAuthUsersModel.findOne({ username: username, password: password }, function(err, user) {
      if(err) return callback(err);
      callback(null, user._id);
    });
  };

  /*
  * Required to support refreshToken grant type
  */
  model.saveRefreshToken = function (token, clientId, expires, userId, callback) {
    console.log('in saveRefreshToken (token: ' + token + ', clientId: ' + clientId +', userId: ' + userId + ', expires: ' + expires + ')');

    var refreshToken = new OAuthRefreshTokensModel({
      refreshToken: token,
      clientId: clientId,
      userId: userId,
      expires: expires
    });

    refreshToken.save(callback);
  };

  model.getRefreshToken = function (refreshToken, callback) {
    console.log('in getRefreshToken (refreshToken: ' + refreshToken + ')');

    OAuthRefreshTokensModel.findOne({ refreshToken: refreshToken }, callback);
  };

  return model;
}