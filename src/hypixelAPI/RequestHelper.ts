import type { RequestCreate } from './RequestCreate';
import { HypixelAPI } from '../@types/hypixel';
import { RateLimitError } from '../util/error/RateLimitError';
import { isAbortError } from '../util/error/helper';

export class AbortError {
  abortsLastMinute: number;
  baseTimeout: number;
  timeoutLength: number;

  constructor() {
    this.abortsLastMinute = 0;
    this.baseTimeout = 30000;
    this.timeoutLength = 30000;
  }

  addAbort(): void {
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

  addTimeToTimeout(): void {
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, this.timeoutLength - this.baseTimeout + 60000);
  }

  reportAbortError(RequestInstance: RequestCreate): void {
    const higherTimeout = Math.max(RequestInstance.instance.resumeAfter, Date.now());
    this.addAbort();
    if (this.abortsLastMinute > 1) RequestInstance.instance.resumeAfter = higherTimeout + this.generateTimeoutLength();
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

  addRateLimit(): void {
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

  addTimeToTimeout():void {
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, this.timeoutLength - this.baseTimeout + 60000);
  }

  reportRateLimitError(RequestInstance: RequestCreate, error: RateLimitError): void {
    const higherTimeout = Math.max(RequestInstance.instance.resumeAfter, Date.now());
    this.addRateLimit();
    this.isGlobal = error.json?.global ?? false;
    RequestInstance.instance.keyPercentage -= 0.05;
    RequestInstance.instance.resumeAfter = higherTimeout + this.generateTimeoutLength();
  }
}

export class Instance {
  abortThreshold: number;
  baseTimeout: number;
  enabled: boolean;
  instanceUses: number;
  keyPercentage: number;
  resumeAfter: number;
  timeoutLength: number;
  unusualErrorsLastMinute: number;

  constructor() {
    this.abortThreshold = 2500;
    this.baseTimeout = 30000;
    this.enabled = true;
    this.instanceUses = 0;
    this.keyPercentage = 0.25;
    this.resumeAfter = 0;
    this.timeoutLength = 60000;
    this.unusualErrorsLastMinute = 0;
  }

  addUnusualError(): void {
    this.unusualErrorsLastMinute += 1;
    setTimeout(() => {
      this.unusualErrorsLastMinute -= 1;
    }, 60000);
  }

  getInstance(): {
    unusualErrorsLastMinute: number,
    instanceUses: number,
    resumeAfter: number,
    keyPercentage: number,
  } {
    return {
      instanceUses: this.instanceUses,
      keyPercentage: this.keyPercentage,
      resumeAfter: this.resumeAfter,
      unusualErrorsLastMinute: this.unusualErrorsLastMinute,
    };
  }

  generateTimeoutLength(): number {
    const timeout = this.timeoutLength;
    this.addTimeToTimeout();
    return timeout;
  }

  addTimeToTimeout(): void {
    this.timeoutLength += this.baseTimeout;
    setTimeout(() => {
      this.timeoutLength -= this.baseTimeout;
    }, this.timeoutLength - this.baseTimeout + 60000);
  }

  reportUnusualError(): void {
    this.addUnusualError();
    if (this.unusualErrorsLastMinute > 1) this.resumeAfter = this.generateTimeoutLength();
  }
}