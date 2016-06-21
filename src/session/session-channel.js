/**
 * Created by PIV on 19.06.2016.
 */
import EventEmitter from 'events';
import stream from 'stream';

export default class Channel extends stream.Transform {
  constructor(channelName, dataCallback) {
    super({ objectMode: true });
    this.name = channelName;
    this.transports = {};
    this.onDataCallback = dataCallback;
    return this;
  }

  _transform(chunk, encoding, done){
    console.log('CALL _transform',chunk, encoding);
    this.push(chunk);
    done();
  }
  
  _flush(){
    console.log('CALL _flush');
  }

  send(message) {
    //console.log('SEND WITH CHANNEL:', this.name, ' MSG:', message);
  }

  cast(message) {
    Object.keys(this.transports)
          .forEach(key => this.transports[key].write(message));
  }

  receive(message) {

  }

  addTransports(obj) {
    Object.keys(obj)
          .forEach(key => this.addTransport(key, obj[key]));
    return this;
  }

  addTransport(id, tr) {
    if (!this.transports[id]) {
      const self = this;
      this.onTransportData = this.onTransportData.bind(this);
      this.onTransportError = this.onTransportError.bind(this);
      this.removeTransport = this.removeTransport.bind(this);
      this.transports[id] = tr
        .on('data', self.onTransportData)
        .on('error', self.onTransportError)
        .on('close', () => self.removeTransport(id));
    }
    return this;
  }

  removeTransport(id) {
    if (!this.transports[id]) return this;
    const self = this;
    this.transports[id]
      .removeListener('data', self.onTransportData)
      .removeListener('error', self.onTransportError)
      .removeListener('close', () => self.removeTransport(id));
    this.transports[id] = null;
    delete this.transports[id];
    return this;
  }

  onTransportError() {

  }

  onTransportData(data) {
    if(this.onDataCallback) this.onDataCallback(data);
    this.emit('data', data);
  }
}
