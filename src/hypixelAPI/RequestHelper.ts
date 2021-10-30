export class AbortError {
  abortsLastMinute: number;

  constructor() {
    this.abortsLastMinute = 0;
  }

  addAbort() {
    this.abortsLastMinute += 1;
    setTimeout(() => {
      this.abortsLastMinute -= 1;
    }, 60000);
  }
}

export class RateLimit {
  cause: string | null;
  rateLimitErrorsLastMinute: number;
  isGlobal: boolean;

  constructor() {
    this.cause = null;
    this.rateLimitErrorsLastMinute = 0;
    this.isGlobal = false;
  }

  addRateLimitError() {
    this.rateLimitErrorsLastMinute += 1;
    setTimeout(() => {
      this.rateLimitErrorsLastMinute -= 1;
    }, 60000);
  }
}

export class Instance {
  errorsLastMinute: number;
  instanceUses: number;
  resumeAfter: number;
  keyPercentage: number;

  constructor() {
    this.errorsLastMinute = 0;
    this.instanceUses = 0;
    this.resumeAfter = 0;
    this.keyPercentage = 0.25;
  }

  addUnusualError() {
    this.errorsLastMinute += 1;
    setTimeout(() => {
      this.errorsLastMinute -= 1;
    }, 60000);
  }
}