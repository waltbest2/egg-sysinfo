export default class Agent {
  private agent;

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
  }

  async serverDidReady() {
    this.agent.logger.info('[egg-sysinfo] agent serverDidReady');
  }

  async beforeClose() {
    this.agent.logger.info('[egg-sysinfo] agent beforeClose');
  }
}