/**
 * Created by PIV on 17.06.2016.
 */
import EventEmitter from 'events';
import stream from 'stream';
import JSONStream from 'JSONStream';
/*
 Сесия должна выполнять мультиплексирование данных,
 Читать и писать в сокет если он доступен...
 */

class SocketWrapper extends stream.Transform {
  constructor() {
    super();
    this.buffer = [];
    this.isPaused = true;
  }

  _read(size) {
    console.log('CALL Try _read ');
    if (!this.isPaused && this.buffer.length > 0) {
      const data = this.buffer.shift();
      console.log('CALL _read ', data);
      this.push(data);
    }
  }

  _write(chunk, encoding, done) {
    console.log('CALL _write ', chunk.toString(), this);
    if (!this.isPaused && this.writable) {
      console.log('CALL _write real ');
      this.push(chunk);
      done();
    } else {
      this.buffer.push(chunk);
    }
  }

  //_writev(chunks, done) {
  //  console.log('CALL _writev ', chunks);
  //this.push(chunk);
  // done();
  // }

  _transform(chunk, encoding, done) {
    console.log('CALL _transform ', chunk.toString(), encoding);
    //if (!this.isPaused)
    //this.push();
    done();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }
}

export default class SessionWorker extends EventEmitter{
  constructor(opt) {
    if (!opt.self || !opt.remote) throw new Error('New Session havent needle options');
    super();
    this.nodeId = opt.self.nodeId;
    this.remoteNodeId = opt.remote.nodeId;
    this.channels = {};
    this.socketWrapper = new SocketWrapper();
  }

  socketUp(socket) {
    console.log('SOCKET UP');
    this.socket = socket;
    this.socketDown = this.socketDown.bind(this);
    socket.on('data', data => console.log('Session-worker:',data));
    //process.stdin.pipe(socket);
    // this.socket.pipe(this.socketWrapper)
    //    .pipe(this.socket);
    this.socketWrapper.resume();
    this.socket
        .on('close', this.socketDown)
        .resume();
  }

  socketDown(reason) {
    console.log('SOCKET DOWN ', reason);
    this.socketWrapper.pause();
    this.socket.removeListener('close', this.socketDown);
    this.socket = null;
  }

  write(a) {
    console.log('CALL write ', a);
  }

  /*
   */

  /* onNewStream(stream, name) {
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
   */
  addSocketCandidate(socket) {
    if (this.socket) { socket.destroy(); }
    else { this.socketUp(socket); }
  }
}
