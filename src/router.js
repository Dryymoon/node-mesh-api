/**
 * Created by PIV on 19.06.2016.
 */
import uuid from 'uuid4';
import RandomLib from 'random-js';
import Discovery from './net/udp-discovery';
import Server from './net/tcp-server';
import Session from './session/session';
import Api from './api/api';

const random = new RandomLib(RandomLib.engines.mt19937()
                                      .autoSeed());
const nodeId = uuid();
const nodeWeight = random.integer(0, 2147483647);

const discovery = new Discovery({ nodeId, nodeWeight })
  .on('error', err => console.log('FACKUP', err))
  .on('detected', (data) => Session.establishByDiscovery({ self: { nodeId, nodeWeight }, remote: data }));

const server = new Server()
  .on('error', err => console.log('FACKUP', err))
  .on('ready', () => discovery.promote({ proto: server.proto, port: server.port }))
  .on('new-socket', socket => Session.establishBySocket({ self: { nodeId, nodeWeight }, socket }));

Session
  .on('session-created', (id, worker) => {
    console.log('session-created', id);
    //worker.on('data', d => console.log('session-received', JSON.parse(d.data)));
  })
  .on('session-destroed', id=> {});

//Session.listen('service-provided');

const selfProvidedServices = {};

Api.$$__on('provider-created', (name, provider) =>
  provider.$$__on('service-created', (data) => {
    Session
      .channel('provider')
      .send(data);
  }));


