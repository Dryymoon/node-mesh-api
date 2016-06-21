/**
 * Created by PIV on 20.06.2016.
 */
import stream from 'stream';
import TransformKeepAlive from './tf-keep-alive';
import TransformSession from './tf-which-session';

export default class SocketWrapper extends stream.Duplex {
  constructor(socket, options) {
    super(options);
    socket
      .setEncoding('utf8')
      .once('error', () => socket.destroy())
      .pipe(new TransformKeepAlive(socket))
      .pipe(new TransformSession(socket));
    return socket;
  }
}
