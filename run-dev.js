#!/usr/bin/env node
/* eslint-disable */

process.on('unhandledRejection', function (err) {
  console.error('CATCHER unhandledRejection',err.stack);
});

process.on('uncaughtException', function (err) {
  console.log('CATCHER uncaughtException', err.stack);
});
process.on('error', function (err) {
  console.log('CATCHER error',err.stack);
});

var fs = require('fs');
var babelrc = fs.readFileSync('./.babelrc');
var config;

try {
  config = JSON.parse(babelrc);
} catch (err) {
  console.error('==>     ERROR: Error parsing your .babelrc.');
  console.error(err);
}

require('babel-register')(config);

var path = require('path');
global.rootDir = path.resolve(__dirname, '.');
//const isDevelopment = require('get-env')() === 'dev';
global.__DEVELOPMENT__ = require('get-env')() === 'dev';





/*if (__DEVELOPMENT__) {
  if (!require('piping')({
      hook: true,
      ignore: /(\/\.|~$|\.json|\.scss$)/i
    })) {
    return;
  }
}
*/
require('./src/main.js');
