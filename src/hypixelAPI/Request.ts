import fetch, { RequestInit, Response } from 'node-fetch';
import { isAbortError } from '../util/error/helper';

export class Request {
  aborts: number;
  abortThreshold: number;

  constructor({
    abortThreshold,
  }: {
    maxAborts?: number;
    abortThreshold?: number,
  }) {
    this.aborts = 0;
    this.abortThreshold = abortThreshold ?? 2500;
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
      if (isAbortError(err) && this.aborts < 1) {
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