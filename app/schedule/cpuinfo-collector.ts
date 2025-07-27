import { Subscription } from 'egg';

export default class CpuInfoCollector  extends Subscription {

  static get schedule() {
    return {
      interval: '2s', // 每2秒执行一次
      type: 'worker', // 所有worker执行
    };
  }

  async subscribe() {
    this.ctx.app.message.sendToAgent('sysinfo-refresh', 'refresh');

}