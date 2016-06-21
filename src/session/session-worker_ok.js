/**
 * Created by PIV on 17.06.2016.
 */
import EventEmitter from 'events';
import multiplexLib from 'multiplex';
import Channel from './session-channel';
//import Parser from 'binary-parser';

export default class SessionWorker extends EventEmitter {
  constructor(opt) {
    if (!opt.self || !opt.remote) throw new Error('New Session havent needle options');
    super();
    this.nodeId = opt.self.nodeId;
    this.remoteNodeId = opt.remote.nodeId;
    // console.log('CONSTRUCT SESSION  ', this.nodeId, ' <-> ', this.remoteNodeId);
    this.sendStreams = {};
    this.receiveStreams = {};
  }

  socketUp(socket) {
    this.socket = socket;
    this.socketDown = this.socketDown.bind(this);
    this.onNewStream = this.onNewStream.bind(this);

    // MULTIPLEX CONSTRUCTOR;

    this.multiplex = multiplexLib();
    this.multiplex.on('stream', this.onNewStream);
    this.multiplex.on('error', (err) => console.log('Multiplex error:', err));
    this.pingStream = this.multiplex.createSharedStream('ping-stream');
    this.pingStream.on('error', (err) => console.log('PingStream error:', err));
    this.onPing = this.onPing.bind(this);
    this.pingStream.on('data', this.onPing);
    // this.stdinStream = this.multiplex.createStream('stdin-stream');
    // process.stdin.pipe(function(a,b,c){console.log('B', a,b,c);})
    // process.stdin.pipe(this.stdinStream);
    // process.stdin.resume();
    // this.multiplex.receiveStream('stdin-stream')
    //    .pipe(process.stdout);

    this.socket
        .pipe(this.multiplex)
        .pipe(this.socket);

    this.socket
        .on('close', this.socketDown)
        .resume();

    this.pingStart();
  }

  socketDown() {
    console.log('SOCKET DOWN');
    this.multiplex.destroy();
    //this.multiplex.cork();
    this.pingStop();
    this.socket = null;
  }

  onNewStream(stream, name) {
    const self = this;
    stream.on('data', data =>
      self.emit('data',
        {
          session: self.remoteNodeId,
          channel: name,
          data
        }));
  }

  send(channel, data) {
    if (!this.sendStreams[channel]) {
      this.sendStreams[channel] = this.multiplex.createStream(channel);
    }
    this.sendStreams[channel].write(JSON.stringify(data));
  }

  addSocketCandidate(socket) {
    if (this.socket) { socket.destroy(); }
    else { this.socketUp(socket); }
  }

  pingStart() {
    this.pongMissing = 0;
    this.ping = this.ping.bind(this);
    this.pingIntervalRef = setInterval(this.ping, 2000);
  }

  pingStop() {
    if (this.pingIntervalRef) clearInterval(this.pingIntervalRef);
  }

  ping() {
    console.log('+ping');
    if (!this.pingStream) throw new Error('Error in session ping, no socket');
    if (this.pongMissing > 5 && this.socket) this.socket.destroy();
    this.pongMissing++;
    this.pingStream.write('ping');
  }

  onPing() {
    console.log('-pong');
    this.pongMissing = 0;
  }
}
