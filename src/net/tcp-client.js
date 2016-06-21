/**
 * Created by PIV on 13.06.2016.
 */
import net from 'net';
import tls from 'tls';
import merge from 'merge';
import SocketWrapper from './tcp-socket';

export default class Client {
  constructor(options = {}) {
    if (!options.host || !options.port) throw new Error('Client optins must have host and port');
    this.isSSL = !!options.ssl;
    this.sslConf = options.ssl && options.ssl.client || {};
    const sockOptions = { host: options.host, port: options.port };
    const mergedOptions = this.isSSL ? merge(this.sslConf, sockOptions) : sockOptions;
    const layer = this.isSSL ? tls.connect : net.connect;
    this.socket = new SocketWrapper(layer(mergedOptions));
    return this;
  }
}
