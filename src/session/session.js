/**
 * Created by PIV on 13.06.2016.
 */
import EventEmitter from 'events';
import Joi from 'joi';
import Client from '../net/tcp-client';
import jsonParse from 'json-safe-parse';
import { schemaOptsWithSockets, schemaOptsWithFutureConnection } from './session-validators';
import Worker from './session-worker';
import ChannelWorker from './session-channel';

class Sessions extends EventEmitter {
  constructor() {
    super();
    this._sessionEstablishing = {};
    this._sessionStore = {};
    this.globalChanels = {};
  }

  _isMaster(opt) {
    return opt.self.nodeWeight !== opt.remote.nodeWeight
      ? (opt.self.nodeWeight > opt.remote.nodeWeight)
      : (opt.self.nodeId > opt.remote.nodeId);
  }

  get(id) {
    return this._sessionStore[id];
  }

  maybeCreateChannel(channelName) {

    if (!this.globalChanels[channelName]) {
      this.globalChanels[channelName] =
        new ChannelWorker(channelName)
          .addTransports(this._sessionStore);
    }
    return this.globalChanels[channelName];
  }

  listen(channelName) {
    return this.maybeCreateChannel(channelName);
  }

  channel(channelName) {
    return this.maybeCreateChannel(channelName);
  }

  establishByDiscovery(opt = {}) {
    const self = this;

    const validate = Joi.validate(opt, schemaOptsWithFutureConnection);
    if (validate.error) return validate.error;
    if (this._isMaster(opt)) return; // Подключается только клиент, сервер(Мастер) Ждет подключений.

    const remoteNodeId = opt.remote.nodeId;
    if (!this._sessionStore[remoteNodeId]) {
      this._sessionStore[remoteNodeId] = new Worker({
        self: opt.self,
        remote: opt.remote
      });
      this.onSessionCreated(this._sessionStore[remoteNodeId]);
    }

    if (this._sessionEstablishing[remoteNodeId]) return;
    this._sessionEstablishing[remoteNodeId] = true;

    const port = opt.remote.promote.port;
    // TODO Rewrite choose which we should use remote IPS
    // const host = opt.remote.ips[Math.floor(Math.random() * opt.remote.ips.length)];
    const host = '1.1.1.1';
    console.log('HOST:', host);

    const socket = new Client({ host, port }).socket;
    // console.log('Sock ', socket);
    socket
      .once('connect', () => {
        console.log('connect !!!!!!!!!!!!');
        socket.write(JSON.stringify({ nodeId: opt.self.nodeId, nodeWeight: opt.self.nodeWeight }));
        self._sessionStore[remoteNodeId].addSocketCandidate(socket);
      })
      .once('close', () => {
        self._sessionEstablishing[remoteNodeId] = null;
        delete self._sessionEstablishing[remoteNodeId];
      });
  }

  establishBySocket(opt = {}) {
    const self = this;
    const validate = Joi.validate(opt, schemaOptsWithSockets);
    if (validate.error) return validate.error;
    this.onSessionCreated = this.onSessionCreated.bind(this);
    const socket = opt.socket;
    socket
      .once('data', raw => {
        socket.pause();
        let data = {};
        try {
          data = jsonParse(raw, 'ignore');
        } catch (e) {
          socket.end();
          return;
        }

        const remoteNodeId = data.nodeId;
        const remoteNodeWeight = data.nodeWeight;

        if (!remoteNodeId || !remoteNodeWeight) {
          socket.end();
          return;
        }
        if (!self._isMaster({ self: opt.self, remote: { nodeId: remoteNodeId, nodeWeight: remoteNodeWeight } })) {
          socket.end();
          return;
        }
        if (self._sessionEstablishing[remoteNodeId]) {
          socket.end();
          return;
        }

        socket.once('close', () => {
          self._sessionEstablishing[remoteNodeId] = null;
          delete self._sessionEstablishing[remoteNodeId];
        });
        this._sessionEstablishing[remoteNodeId] = true;

        if (!self._sessionStore[remoteNodeId]) {
          self._sessionStore[remoteNodeId] = new Worker(
            {
              self: opt.self,
              remote: { nodeId: remoteNodeId, nodeWeight: remoteNodeWeight }
            });
          self.onSessionCreated(this._sessionStore[remoteNodeId]);
        }
        self._sessionStore[remoteNodeId].addSocketCandidate(socket);
      })
      .resume();
  }

  onSessionCreated(worker) {
    const remoteNodeId = worker.remoteNodeId;
    this.onSessionDestroed = this.onSessionDestroed.bind(this);
    Object
      .keys(this.globalChanels)
      .forEach(key => this.globalChanels[key].addTransport(remoteNodeId, worker));
    this.emit('session-created', remoteNodeId, worker);
    const self = this;
    worker.once('destroed', id => self.onSessionDestroed(id));
  }

  onSessionDestroed(id) {
    this.emit('session-destroed', id);
    Object
      .keys(this.globalChanels)
      .forEach(key => this.globalChanels[key].removeTransport(id));
  }
}
const instance = new Sessions();

export default instance;
