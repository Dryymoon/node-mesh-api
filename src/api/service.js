/**
 * Created by PIV on 13.06.2016.
 */
import Promise from 'bluebird';
import args from 'arguments-to-array';

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {
    resolve,
    reject,
    promise
  };
}

export default class Service {
  constructor(name) {
    // this._name = name;
    this._gagStore = [];
    this._gag = this._gag.bind(this);
    this.fun = this._gag;
  }

  _gag() {
    const self = this;
    const deferred = defer();
    const obj = {
      ts: Date.now(),
      arguments: args(arguments),
      deferred
    };
    self._gagStore.push(obj);
    return deferred.promise;
  }

  getParams() {
    const fstr = this.fun.toString();
    return fstr
      .match(/\(.*?\)/)[0]
      .replace(/[()]/gi, '')
      .replace(/\s/gi, '')
      .split(',');
  }

  register(fun) {
    this.fun = fun;
    this._gagStore.forEach(it =>
      Promise.try(() => fun.apply(null, it.arguments))
             .then(res => it.deferred.resolve(res))
             .catch(err => it.deferred.reject(err))
    );
  }
}
