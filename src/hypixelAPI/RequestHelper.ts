export class AbortError {
  abortsLastMinute: number;
  baseTimeout: number;
  timeoutLength: number;

  constructor() {
    this.abortsLastMinute = 0;
    this.baseTimeout = 30000;
    this.timeoutLength = 30000;
  }

  addAbort() {
    this.abortsLastMinute += 1;
    setTimeout(() => {
      this.abortsLastMinute -= 1;
    }, 60000);
  }

  generateTimeoutLength(): number {
    const timeout = this.timeoutLength;
    this.addTimeToTimeout();
    return timeout;
  }

  addTimeToTimeout() {
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, this.timeoutLength - this.baseTimeout + 60000);
  }
}

export class RateLimit {
  baseTimeout: number;
  isGlobal: boolean;
  rateLimitErrorsLastMinute: number;
  timeoutLength: number;

  constructor() {
    this.baseTimeout = 60000;
    this.isGlobal = false;
    this.rateLimitErrorsLastMinute = 0;
    this.timeoutLength = 60000;
  }

  setRateLimit({
    isGlobal,
  }: {
    isGlobal: boolean,
  }) {
    this.isGlobal = isGlobal;
    this.rateLimitErrorsLastMinute += 1;
    setTimeout(() => {
      this.rateLimitErrorsLastMinute -= 1;
    }, 60000);
  }

  generateTimeoutLength(): number {
    if (this.isGlobal === true) return this.timeoutLength + 5 * this.baseTimeout;
    else {
      const timeout = this.timeoutLength;
      this.addTimeToTimeout();
      return timeout;
    }
  }

  addTimeToTimeout() {
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, this.timeoutLength - this.baseTimeout + 60000);
  }
}

export class Instance {
  baseTimeout: number;
  enabled: boolean;
  unusualErrorsLastMinute: number;
  instanceUses: number;
  resumeAfter: number;
  keyPercentage: number;
  timeoutLength: number;

  constructor() {
    this.baseTimeout = 30000;
    this.enabled = true;
    this.unusualErrorsLastMinute = 0;
    this.instanceUses = 0;
    this.resumeAfter = 0;
    this.keyPercentage = 0.25;
    this.timeoutLength = 60000;
  }

  addUnusualError() {
    this.unusualErrorsLastMinute += 1;
    setTimeout(() => {
      this.unusualErrorsLastMinute -= 1;
    }, 60000);
  }

  getInstance() {
    return {
      unusualErrorsLastMinute: this.unusualErrorsLastMinute,
      instanceUses: this.instanceUses,
      resumeAfter: this.resumeAfter,
      keyPercentage: this.keyPercentage,
    };
  }

  generateTimeoutLength(): number {
    const timeout = this.timeoutLength;
    this.addTimeToTimeout();
    return timeout;
  }

  addTimeToTimeout() {
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, this.timeoutLength - this.baseTimeout + 60000);
  }
}