/**
 * Created by PIV on 20.06.2016.
 */
const Transform = require('stream').Transform;

const PING = 'ping';
const PingBufferExample = Buffer.from(PING);

export default class SocketKeepAlive extends Transform {
  constructor(socket) {
    super();
    this.destroy = this.destroy.bind(this);
    this.socket = socket
      .once('close', this.destroy)
      .setTimeout(15000, () => this.socket.destroy());
    this.tsLastReceived = Date.now();
    this.onIntervalCheck = this.onIntervalCheck.bind(this);
    this.intervalRef = setInterval(this.onIntervalCheck, 2000);
    this.destroed = false;
    this.needTsLastReceived = true;
  }

  _transform(chunk, encoding, callback) {
    if (this.needTsLastReceived) {
      // Optimize speed on highLoaded transports
      this.needTsLastReceived = false;
      this.tsLastReceived = Date.now();
    }
    if (!PingBufferExample.equals(chunk)) {
      console.log('KeepAlive chunk: ', chunk.toString());
      this.push(chunk);
    }
    callback();
  }

  onIntervalCheck() {
    this.needTsLastReceived = true;
    if (!this.destroed
      && this.socket
      && this.socket.writable) this.socket.write(PING);
    if (Date.now() - this.tsLastReceived > 10000) this.destroy();
  }

  destroy() {
    if (this.destroed) return;
    this.destroed = true;
    if (this.intervalRef) clearInterval(this.intervalRef);
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
  }
}
