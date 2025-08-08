import { Application } from "egg";

export default class AppBookHook {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
    this.app.logger.info('[egg-sysinfo] start to init app');
    
  }

  async configWillLoad() {
    this.app.logger.info('[egg-sysinfo] app configWillLoad');
  }

  async beforeStart() {
    this.app.logger.info('[egg-sysinfo] app beforeStart');
  }

  async didLoad() {
    this.app.logger.info('[egg-sysinfo] app didLoad');
  }

  async willReady() {
    this.app.logger.info('[egg-sysinfo] app willReady');
    this.app.sysinfo = this.app.sysinfo || {};
    this.app.messenger.on('notify-sysinfo', data => {
      this.app.sysinfo.cpu = data.cpu;
      this.app.sysinfo.mem = data.mem;
    })
  }

  async didReady() {
    this.app.logger.info('[egg-sysinfo] app didReady');
  }

  async serverDidReady() {
    this.app.logger.info('[egg-sysinfo] app serverDidReady');
  }

  async beforeClose() {
    this.app.logger.info('[egg-sysinfo] app beforeClose');
  }
}