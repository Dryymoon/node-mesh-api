/**
 * Created by PIV on 12.06.2016.
 */

if (__DEVELOPMENT__) {
  require('longjohn');
  const dateFormat = require('dateformat');
  require('log-timestamp')(() => `${dateFormat(new Date(), 'HH:MM:ss.l')} %s`);
}


import Promise from 'bluebird';
import Router from './router';
import Api from './api/api';

/*
 import appRootDirLib from 'app-root-dir';
 import fs from 'fs';

 const ROOTDIR = appRootDirLib.get();
 const SSL = {
 server: {
 key: fs.readFileSync(ROOTDIR + '/crt/ryans-key.pem'),
 cert: fs.readFileSync(ROOTDIR + '/crt/ryans-cert.pem'),
 requestCert: true
 },
 client: {
 rejectUnauthorized: false
 }
 };*/

// Тест Api
Api.prox.beta('KUKU')
   .then(ret => console.log('After ku: ', ret));

console.log('Call kuku');
setTimeout(() => {
  Api.prox.beta = a => {
    console.log('beta', a);
    return Promise.delay(2000, 'Woow');
  };
}, 3000);

// Test onDiscovery





