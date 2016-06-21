/**
 * Created by PIV on 14.06.2016.
 */
import EventEmitter from 'events';
import os from 'os';
import dgram from 'dgram';
import equal from 'deep-equal';
import merge from 'merge';

const BROADCAST_ADDR = "255.255.255.255";
let _instance = null;
export default class Discovery extends EventEmitter {
  constructor(opt = {}) {
    if (_instance) return _instance;
    super();
    _instance = this;
    this.db = {};
    this.ttl = {};
    this.port = opt.port || process.env.NODE_MESH_BROADCAST_PORT || 50000;
    this.nodeId = opt.nodeId;
    this.nodeWeight = opt.nodeWeight;
    this.collectIps();
    this.startSender();
    this.startReceiver();
    this.emit('ready');
    this.broadcast();

    this.collectIps = this.collectIps.bind(this);
    this.broadcast = this.broadcast.bind(this);
    this.clear = this.clear.bind(this);
    setInterval(this.collectIps, 60000);
    setInterval(this.broadcast, 2000);
    setInterval(this.clear, 2000);
  }

  onMessage(raw, rinfo) {
    try {
      const data = JSON.parse(raw);
      const rNodeId = data.nodeId;
      if (rNodeId == this.nodeId) return; // Pass messages from self;
      if (!rNodeId) return; // Prevent empty message;
      this.ttl[rNodeId] = Date.now();
      if (!this.db[rNodeId]) {
        this.db[rNodeId] = data;
        this.emit('added', this.db[rNodeId]);
        this.emit('detected', this.db[rNodeId]);
        return;
      }
      if (this.db[rNodeId] && !equal(this.db[rNodeId], data)) {
        this.db[rNodeId] = data;
        this.emit('updated', this.db[rNodeId]);
        this.emit('detected', this.db[rNodeId]);
        return;
      }
      this.emit('remind', this.db[rNodeId]);
      this.emit('detected', this.db[rNodeId]);
    } catch (err) {}
  }

  clear() {
    const expireFrom = Date.now() - 6000;
    for (let i in this.ttl) {
      if (this.ttl[i] < expireFrom) {
        const oldObj = this.db[i];
        this.db[i] = null;
        this.ttl[i] = null;
        delete this.db[i];
        delete this.ttl[i];
        this.emit('removed', oldObj);
      }
    }
  }

  promote(data) {
    this.promoteData = data;
  }

  broadcast() {
    const data = { nodeId: this.nodeId, nodeWeight: this.nodeWeight, ips: this.ips };
    this.promoteData ? data.promote = this.promoteData : null;
    const raw = JSON.stringify(data);
    this.sender.send(raw, 0, raw.length, this.port, BROADCAST_ADDR);
  }

  startSender() {
    const self = this;
    this.sender = dgram.createSocket({ reuseAddr: true, type: "udp4" });
    this.sender
        .on('error', err => {
          throw new Error(err);
          self.sender.close();
        })
        .on('listening', () => self.sender.setBroadcast(true))
        .bind();
  }

  startReceiver() {
    const self = this;
    this.onMessage = this.onMessage.bind(this);
    this.receiver = dgram.createSocket({ reuseAddr: true, type: 'udp4' });
    this.receiver
        .on('error', err => {
          throw new Error(err);
          self.receiver.close();
        })
        .on('listening', () => self.receiver.setBroadcast(true))
        .on('message', self.onMessage)
        .bind(self.port);
  }

  collectIps() {
    const ifaces = os.networkInterfaces();
    const ips = [];
    Object
      .keys(ifaces)
      .forEach(ifname =>
        ifaces[ifname].forEach(iface => {
          if ('IPv4' !== iface.family) return; // Reject non ipv4 ip
          if (iface.internal !== false) return; // Reject internal ip
          ips.push(iface.address);
        }));
    this.ips = ips;
  }
}