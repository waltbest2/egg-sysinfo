import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.sysinfo = {
    CPU_WARN: 80,
    MEM_WARN: 80,
  }

  return {
    ...config
  }
}