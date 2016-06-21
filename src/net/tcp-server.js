/**
 * Created by PIV on 12.06.2016.
 */
import EventEmitter from 'events';
import merge from 'merge';
import net from 'net';
import tls from 'tls';
import SocketWrapper from './tcp-socket';

let _serverInstance = null;
export default class Server extends EventEmitter {
  constructor(options = {}) {
    if (_serverInstance) return _serverInstance;
    super();
    _serverInstance = this;
    this.port = options.port || 0;
    this.host = options.host || '0.0.0.0';
    this.isSSL = !!options.ssl;
    this.proto = this.isSSL ? 'ssl' : 'tcp';
    this.sslConf = options.ssl && options.ssl.server || {};
    this.ready = false;
    const sockOptions = { pauseOnConnect: true };
    const mergedSockOptions = this.isSSL ? merge(this.sslConf, options) : sockOptions;
    const layer = this.isSSL ? tls.createServer : net.createServer;
    this.server = layer(mergedSockOptions);
    this.onNewSSLSession = this.onNewSSLSession.bind(this);
    this.onResumeSSLSession = this.onResumeSSLSession.bind(this);
    this.onConnection = this.onConnection.bind(this);
    if (this.isSSL) {
      this.tlsSessionStore = {};
      this.server.on('secureConnection', this.onConnection);
      this.server.on('newSession', this.onNewSSLSession);
      this.server.on('resumeSession', this.onResumeSSLSession);
    } else {
      this.server.on('connection', this.onConnection);
    }
    this.startListen();
    return this;
  }

  startListen() {
    const self = this;
    this.server.listen({ port: this.port, host: this.host }, function () {
      self.ready = true;
      self.port = self.server.address().port;
      self.emit('ready');
    });
  }

  onNewSSLSession(id, data, cb) {
    console.log('onNewSession');
    this.tlsSessionStore[id.toString('hex')] = data;
    cb();
  }

  onResumeSSLSession(id, cb) {
    console.log('onResumeSession');
    cb(null, this.tlsSessionStore[id.toString('hex')] || null);
  }

  onConnection(socket) {
    this.emit('new-socket', new SocketWrapper(socket));
/*    socket
      .pause()
      .setEncoding('utf8')
      .on('error', () => socket.destroy)
      .pipe(new KeepAlive({ socket }));*/
  }
}

