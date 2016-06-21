/**
 * Created by PIV on 17.06.2016.
 */
import EventEmitter from 'events';
import Provider from './provider';

class Api extends EventEmitter {
  constructor() {
    super();
    const self = this;
    this.providers = {};
    this.$$__on = this.on.bind(this);
    this.$$__create = this.create.bind(this);
    return new Proxy(this,
      {
        get(target, provider) {
          if (provider === '$$__on') return self.$$__on;
          if (provider === '$$__create') return self.$$__create;
          // Чтение провайдеров
          if (!self.providers[provider]) {
            self.providers[provider] = new Provider(provider);
            self.emit('provider-created', provider, self.providers[provider]);
          }
          return self.providers[provider];
        }
      }
    );
  }

  create() {

  }
}

const instance = new Api();
export default instance;
