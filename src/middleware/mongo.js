const mongoose = require('mongoose')
const model = require('../model')

module.exports = opt => {
  return async (ctx, next) => {
    await next()
  }
}
