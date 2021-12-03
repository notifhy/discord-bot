import { HypixelModuleInstance } from './HypixelModuleInstance';
import Constants from '../util/constants';

export class HypixelModuleErrors { //extend instance
  instance: HypixelModuleInstance

  abort: {
    baseTimeout: number,
    timeout: number,
    resetTimeout: number | undefined,
    lastMinute: number,
  };

  rateLimit: { isGlobal: boolean }
    & typeof this.abort;

  error: typeof this.abort;

  constructor(instance: HypixelModuleInstance) {
    this.instance = instance;

    this.abort = {
      baseTimeout: 0, //The timeout each type starts out with
      timeout: 0, //The current timeout of each type; this is to be added onto <Instance>.resumeAfter
      resetTimeout: undefined, //A setTimeout to reset the timeout length
      lastMinute: 0, //Each type's incident count for the last minute
    };

    this.rateLimit = {
      baseTimeout: 60_000,
      timeout: 60_000,
      resetTimeout: undefined,
      lastMinute: 0,
      isGlobal: false,
    };

    this.error = {
      baseTimeout: 30_000,
      timeout: 30_000,
      resetTimeout: undefined,
      lastMinute: 0,
    };
  }

  addAbort() {
    this.base({
      type: 'abort',
    });
  }

  addRateLimit(rateLimitGlobal?: boolean) {
    this.rateLimit.isGlobal = rateLimitGlobal ?? this.rateLimit.isGlobal;
    this.instance.keyPercentage -= 0.05;
    this.base({
      type: 'rateLimit',
    });
  }

  addError() {
    this.base({
      type: 'error',
    });
  }

  private base({
    type,
  }: {
    type: 'abort' | 'rateLimit' | 'error',
  }) {
    this.instance.resumeAfter = Math.max(this.instance.resumeAfter, Date.now() + this[type].timeout); //Sets the new delay by setting <Instance>.resumeAfter

    const newTimeout = this[type].timeout * 2 || Constants.ms.minute / 2;

    this[type].timeout = newTimeout; //Setting new timeout

    this[type].lastMinute += 1; //Adding a type to the count
    setTimeout(() => {
      this[type].lastMinute -= 1; //Removing a type from the count
    }, Constants.ms.minute);

    if (this[type].resetTimeout !== undefined) { //Clears the type's existing timeout, if any
      clearTimeout(this[type].resetTimeout);
    }

    this[type].resetTimeout = setTimeout(() => { //Returns type number rather than NodeJS.timeout
      this[type].timeout = this[type].baseTimeout; //Sets a timeout to set the timeout back to 0
    }, newTimeout + Constants.ms.minute) as unknown as number;
  }
}