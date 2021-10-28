export class RateLimit {
  rateLimit: boolean;
  isGlobal: boolean;
  cause: string | null;

  constructor() {
    this.rateLimit = false;
    this.isGlobal = false;
    this.cause = null;
  }
}

export class Instance {
  sessionUses: number;
  abortsLastMinute: number;
  errorsLastMinute: number;
  resumeAfter: number | null;
  keyPercentage: number;

  constructor() {
    this.sessionUses = 0;
    this.abortsLastMinute = 0;
    this.errorsLastMinute = 0;
    this.resumeAfter = null;
    this.keyPercentage = 25;
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