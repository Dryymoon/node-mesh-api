/**
 * Created by PIV on 13.06.2016.
 */
import EventEmitter from 'events';
import Service from './service';

export default class Provider extends EventEmitter {
  constructor(name) {
    super();
    const self = this;
    this.name = name;
    this.services = {};
    this.$$__on = this.on.bind(this);
    this.$$__create = this.create.bind(this);
    return new Proxy(this, {
      // Чтение сервиса, возвращаем функцию
      get(target, service) {
        if (service === '$$__on') return self.$$__on;
        if (service === '$$__create') return self.$$__create;
        if (!self.services[service]) {
          self.services[service] = new Service(service);
        }
        return self.services[service].fun;
      },
      set(target, service, fn) {

        if (!self.services[service]) {
          self.services[service] = new Service(service);
        }
        self.services[service].register(fn);
        const params = self.services[service].getParams();
        self.emit('service-created', { provider: self.name, service, params });

        return true;
      }
    });
  }

  create() {

  }
}
