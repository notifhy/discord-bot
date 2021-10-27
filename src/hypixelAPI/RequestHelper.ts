export class RateLimit {
  rateLimit: boolean;
  isGlobal: boolean;
  restartAfter: number | null;

  constructor() {
    this.rateLimit = false;
    this.isGlobal = false;
    this.restartAfter = null;
  }

  setRateLimit(rateLimit: boolean, isGlobal: boolean, restartAfter: number) {
    this.rateLimit = rateLimit;
    this.isGlobal = isGlobal;
    this.restartAfter = restartAfter;
  }
}

export class Instance {
  abortsLastMinute: number;
  errorsLastMinute: number;
  sessionUses: number;
  isOK: boolean;

  constructor() {
    this.abortsLastMinute = 0;
    this.errorsLastMinute = 0;
    this.sessionUses = 0;
    this.isOK = true;
  }

  addAbort() {
    this.abortsLastMinute += 1;
    setTimeout(() => {
      this.abortsLastMinute -= 1;
    }, 60000);
  }

  addError() {
    this.errorsLastMinute += 1;
    setTimeout(() => {
      this.errorsLastMinute -= 1;
    }, 60000);
  }
}