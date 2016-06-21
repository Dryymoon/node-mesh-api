/**
 * Created by PIV on 21.06.2016.
 */
const Transform = require('stream').Transform;

export default class WhichSession extends Transform {
  _transform(chunk, encoding, callback) {
//    if (chunk.toString == 'Session') {
//      console.log('KeepAlive chunk: ', chunk.toStirng());
      this.push(chunk);
//    }
    callback();
  }
}
