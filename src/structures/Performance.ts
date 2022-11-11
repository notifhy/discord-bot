import { Collection } from 'discord.js';
import { Options } from '../utility/Options';

/* eslint-disable no-underscore-dangle */

type PerformanceOptions = {
    interval?: number;
    maxDataPoints?: number;
};

export class Performance {
    private readonly current: Collection<string, number>;

    public interval: number;

    public latest: Collection<string, number> | null;

    public readonly dataPoints: Collection<string, number>[];

    public readonly maxDataPoints: number;

    constructor(options?: PerformanceOptions) {
        this.current = new Collection();
        this.dataPoints = [];
        this.interval = options?.interval ?? Options.performanceInterval;
        this.latest = null;
        this.maxDataPoints = options?.maxDataPoints ?? Options.performanceMaxDataPoints;
    }

    public set(key: string) {
        this.current.set(key, Date.now());
    }

    public addDataPoint() {
        this.current.sort((firstValue, secondValue) => firstValue - secondValue);

        const end = Date.now();
        const start = this.current.first()!;
        const total = end - start;

        Array.from(this.current).forEach(([key, value], index) => {
            const nextData = this.current.at(index + 1) ?? end;
            this.current.set(key, (nextData ?? end) - value);
        });

        this.current.set('end', end);
        this.current.set('total', total);

        // Add historic data
        const latestTimestamp = this.dataPoints[0]?.get('end');

        if (Date.now() > (latestTimestamp ?? 0) + this.interval) {
            this.dataPoints.push(this.current.clone());
            this.dataPoints.length = Math.min(this.dataPoints.length, this.maxDataPoints);
        }

        this.latest = this.current.clone();

        this.current.clear();
    }
}
