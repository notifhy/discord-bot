import fetch, { RequestInit, Response } from 'node-fetch';
import { isAbortError } from './error/helper';

export class Request {
  aborts: number;
  abortThreshold: number;
  maxAborts: number;

  constructor({
    maxAborts,
    abortThreshold,
  }: {
    maxAborts?: number;
    abortThreshold?: number,
  }) {
    this.aborts = 0;
    this.abortThreshold = abortThreshold ?? 2500;
    this.maxAborts = maxAborts ?? 1;
  }

  async request(url: string, fetchOptions?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => controller.abort(), this.abortThreshold).unref();

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        ...fetchOptions,
      });
      return response;
    } catch (err) {
      if (isAbortError(err) && this.aborts < this.maxAborts) {
        this.aborts += 1;
        const retry = await this.request(url, fetchOptions);
        return retry;
      }

      throw err;
    } finally {
      clearTimeout(abortTimeout);
    }
  }
}