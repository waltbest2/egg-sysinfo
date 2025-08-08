
import os from 'os';
import fs from 'fs';
import child_process from 'child_process';
import { math } from './math';

export interface LinuxCpuInfo {
  cpuNum: number;
  dockerUsage: number;
  sumTotal: number;
  tickNo: number;
  cpuLimit: number;
}

export interface WinCPUInfos {
  /**
   * 单核cpu的空闲时间
   */
  idle: number;

  /**
   * 单核cpu的总时间
   */
  tick: number;
}

function getWinCpuInfos(): WinCPUInfos {
  let idleCpu = 0;
  let tickCpu = 0;
  const cpus = os.cpus();
  const length = cpus.length;
  let i = 0;
  while (i < length) {
    const cpu = cpus[i];

    for (const type of Object.keys(cpu.times)) {
      tickCpu += cpu.times[type];
    }

    idleCpu += cpu.times.idle;
    i++;
  }

  const time = {
    idle: math.div(idleCpu, cpus.length), // 单核cpu的空闲时间
    tick: math.div(tickCpu, cpus.length) // 单核cpu的总时间
  }

  return time;
}

function getLinuxCpuInfos(): LinuxCpuInfo {
  const sysPerCPUFile = '/sys/fs/cgroup/cpu/cpuacct.usage_percpu';
  const sysDockerCPUFile = '/sys/fs/cgroup/cpu/cpuacct.usage';
  const sysCPUStat = '/proc/stat';
  const sysCPULimit = '/sys/fs/cgroup/cpu/cpu.cfs_quota_us';
  const sysCLKCommand = 'getconf CLK_TCK';

  const perCPUUsage = fs.readFileSync(sysPerCPUFile, 'utf8');
  const perCPUUsageArray = perCPUUsage.toString().trim().replace(/\s+/g, ',').split(',');
  const cpuNum = perCPUUsageArray.length;
  const dockerUsage = Number(fs.readFileSync(sysDockerCPUFile, 'utf8').toString());
  const statCPU = fs.readFileSync(sysCPUStat, 'utf8');
  const statCPUArray = statCPU.toString().trim().split('\r\n');

  let i = 0;
  while( statCPUArray[i].indexOf('cpu ') < 0) {
    i++;
  }

  const statCPUInfo = statCPUArray[i].trim().replace(/\s+/g, ',').split(',');
  let sumTotal = 0;
  if (statCPUInfo.length > 8) {
    for (let j = 1; j < 8; j++) {
      sumTotal += Number(statCPUInfo[j]);
    }
  }

  const tickNo = Number(child_process.execSync(sysCLKCommand).toString().trim());
  const cpuLimit = Number(fs.readFileSync(sysCPULimit, 'utf8').toString().trim());

  return {
    cpuNum,
    dockerUsage,
    sumTotal,
    tickNo,
    cpuLimit
  };
}

function calcLinuxCpuUsage(lastCPUInfos: LinuxCpuInfo, currentCPUInfos: LinuxCpuInfo): number {
  const dockerUsage = math.sub(currentCPUInfos.dockerUsage, lastCPUInfos.dockerUsage);
  const totalUsage = math.sub(currentCPUInfos.sumTotal, lastCPUInfos.sumTotal);
  const totalUsageInNanoSeconds = math.round(
    math.div(
      math.mul(totalUsage, 1000 * 1000 * 1000),
      lastCPUInfos.tickNo
    )
  );

  const cpuUsage = math.round(
    math.div(
      math.mul(
        math.mul(
          math.round(
            math.div(dockerUsage, totalUsageInNanoSeconds),
            6
          ),
          lastCPUInfos.cpuNum
        ),
        100
      ),
      math.round(
        math.div(lastCPUInfos.cpuLimit, 100 * 1000)
      )
    ),
    4
  );

  return cpuUsage;
}

function calcWinCpuUsage(lastCPUInfos: WinCPUInfos, currentCPUInfos: WinCPUInfos): number {
  const idle = math.sub(currentCPUInfos.idle, lastCPUInfos.idle);
  const tick = math.sub(currentCPUInfos.tick, lastCPUInfos.tick);
  const cpuUsage = math.round(
    math.mul(
      math.sub(
        1,
        math.div(idle, tick)
      ),
      100
    ),
    4
  );

  return cpuUsage;
}

function calcCpuInfo(lastInfos: LinuxCpuInfo | WinCPUInfos, currentInfos: LinuxCpuInfo | WinCPUInfos, osType?: string): number {
  if (osType === 'linux' || os.platform().indexOf('win') === -1) {
    return calcLinuxCpuUsage(lastInfos as LinuxCpuInfo, currentInfos as LinuxCpuInfo);
  } else {
    return calcWinCpuUsage(lastInfos as WinCPUInfos, currentInfos as WinCPUInfos);
  }
}

function getOSCpuFile(): LinuxCpuInfo | WinCPUInfos {
  if (os.platform().indexOf('win') > -1) {
    return getWinCpuInfos();
  } else {
    return getLinuxCpuInfos();
  }
} 

export default {
  getOSCpuFile,
  calcCpuInfo,
}