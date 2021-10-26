import { timeout } from '../util/utility';

interface RateLimit {
  rateLimit: boolean;
  isGlobal: boolean;
  restartAfter: number;
}

interface Instance {
  abortsLastMinute: number;
  errorsLastMinute: number;
  sessionUses: number;
}

export class HypixelAPI {
  rateLimit: RateLimit;
  instance: Instance;
  isOk: boolean;

  constructor(users: number, keyLimit: number) {
    this.rateLimit = {
      rateLimit: false,
      isGlobal: false,
      restartAfter: 0,
    };

    this.instance = {
      abortsLastMinute: 0,
      errorsLastMinute: 0,
      sessionUses: 0,
    };

    this.isOk = false;
  }

  setRateLimit(rateLimit: boolean, isGlobal: boolean, restartAfter: number) {
    this.rateLimit.rateLimit = rateLimit;
    this.rateLimit.isGlobal = isGlobal;
    this.rateLimit.restartAfter = restartAfter;
  }

  async addAbort() {
    this.instance.abortsLastMinute += 1;
    await timeout(60000);
    this.instance.abortsLastMinute -= 1;
  }

  async addError() {
    this.instance.errorsLastMinute += 1;
    await timeout(60000);
    this.instance.errorsLastMinute -= 1;
  }

  addUse() {
    this.instance.sessionUses += 1;
  }
};