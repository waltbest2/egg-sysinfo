import fs from 'fs';
import os from 'os';
import { math } from './math';
import { get } from 'http';

export interface MemInfos {
  usedMem: number;
  currentMem: number;
  totalMem: number;
}

function getExtraCacheMem(): number {
  const statFile = '/sys/fs/cgroup/memory/memory.stat';
  const content = fs.readFileSync(statFile, 'utf8').toString().trim();
  const inactiveReg = /inactive_file\s(.*)/;
  let inactive_file = 0;
  let sourceM = inactiveReg.exec(content);
  if (sourceM !== null) {
    inactive_file = parseInt(sourceM[1], 10);
  }

  const activeReg = /\nactive_file\s(.*)/;
  let active_file = 0;
  sourceM = activeReg.exec(content);
  if (sourceM !== null) {
    active_file = parseInt(sourceM[1], 10);
  }

  return inactive_file + active_file;
}

function getLinuxMemInfos(): MemInfos {
  const sysMemUsedFile = '/sys/fs/cgroup/memory/memory.usage_in_bytes';
  const sysMemLimitFile = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
  const currentMem = Number(fs.readFileSync(sysMemUsedFile, 'utf8').toString().trim());
  const totalMem = Number(fs.readFileSync(sysMemLimitFile, 'utf8').toString().trim());
  const extraCache = getExtraCacheMem();

  return {
    usedMem: currentMem,
    currentMem: currentMem - extraCache,
    totalMem
  };
}

function getWinMemInfos(): MemInfos {
  const sysFree = os.freemem();
  const sysTotal = os.totalmem();

  return {
    usedMem: sysTotal - sysFree,
    currentMem: sysTotal - sysFree,
    totalMem: sysTotal
  };
}

function getMemInfo(): MemInfos {
  if (os.platform().indexOf('win') === -1) {
    return getLinuxMemInfos();
  } else {
    return getWinMemInfos();
  }
}

export default {
  getMemInfo,
  calcMemInfo(): { memRate: number, usedMemRate: number } {
    const memInfos = getMemInfo();
    const memRate = math.round(
      math.mul(
        math.div(memInfos.currentMem, memInfos.totalMem),
        100
      ),
      4
    );

    const usedMemRate = math.round(
      math.mul(
        math.div(memInfos.usedMem, memInfos.totalMem),
        100
      ),
      4
    );

    return {
      memRate,
      usedMemRate
    };
  }
}

