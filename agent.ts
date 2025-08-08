import cpuUtils, { LinuxCpuInfo, WinCPUInfos } from "./app/lib/cpu-utils";
import memUtils from "./app/lib/mem-utils";

export default class Agent {
  private agent;
  private lastCpuInfo: LinuxCpuInfo | WinCPUInfos;

  constructor(agent) {
    this.agent = agent;
    this.agent.logger.info('[egg-sysinfo] start to init agent!');
  }

  async configWillLoad() {
    this.agent.logger.info('[egg-sysinfo] agent configWillLoad');
  }

  async beforeStart() {
    this.agent.logger.info('[egg-sysinfo] agent beforeStart');
  }

  async didLoad() {
    this.agent.logger.info('[egg-sysinfo] agent didLoad');
  }

  async didReady() {
    this.agent.logger.info('[egg-sysinfo] agent didReady');
    this.init();
  }

  async serverDidReady() {
    this.agent.logger.info('[egg-sysinfo] agent serverDidReady');
  }

  async beforeClose() {
    this.agent.logger.info('[egg-sysinfo] agent beforeClose');
  }

  private getCpuUsageRate(): number {
    const currentCpuInfo: LinuxCpuInfo | WinCPUInfos = cpuUtils.getOSCpuFile();
    let cpuRate = 0;
    if (this.lastCpuInfo) {
      cpuRate = cpuUtils.calcCpuInfo(this.lastCpuInfo, currentCpuInfo);
    }
    this.lastCpuInfo = currentCpuInfo;
    return cpuRate;
  }

  private getMemUsageRate(): { memRate: number, usedMemRate: number } {
    const memInfo: { memRate: number, usedMemRate: number } = memUtils.calcMemInfo();
    const memRate = memInfo.memRate;
    const usedMemRate = memInfo.usedMemRate;

    return {
      memRate,
      usedMemRate
    }
  }

  private init() {
    let [ cpuAlarmTimes, memAlarmTimes ] = [0, 0];
    const MAX_ALARM_TIMES = 30;
    const { CPU_WARN, MEM_WARN } = this.agent.config.sysinfo;

    this.agent.messenger.on('sysinfo-refresh', async () => {
      const cpuRate = this.getCpuUsageRate();
      const memInfo: { memRate: number, usedMemRate: number } = this.getMemUsageRate();
      const memRate = memInfo.memRate;

      if (CPU_WARN > 0 && cpuRate >= CPU_WARN && cpuAlarmTimes < MAX_ALARM_TIMES) {
        cpuAlarmTimes++;
        this.agent.logger.warn(`[egg-sysinfo] CPU usage rate is ${cpuRate}%, which exceeds the warning threshold of ${CPU_WARN}%.`);
      } else if (CPU_WARN > 0 && cpuRate < CPU_WARN) {
        cpuAlarmTimes = 0;
      }

      if (MEM_WARN > 0 && memRate >= MEM_WARN && memAlarmTimes < MAX_ALARM_TIMES) {
        memAlarmTimes++;
        this.agent.logger.warn(`[egg-sysinfo] Memory usage rate is ${memRate}%, which exceeds the warning threshold of ${MEM_WARN}%.`);
      } else if (MEM_WARN > 0 && memRate < MEM_WARN) {
        memAlarmTimes = 0;
      }

      this.agent.sysinfo = {
        cpuRate,
        memRate,
        usedMemRate: memInfo.usedMemRate,
      };

      this.agent.messenger.sendToApp('notify-sysinfo', {
        cpu: cpuRate,
        mem: memRate
      });
      
    });
  }
}