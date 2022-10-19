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

        if (this.current.size > 2) {
            const end = Date.now();
            const first = this.current.first()!;
            const last = this.current.last()!;
            const total = last - first;

            this.current.set('end', end);

            Array.from(this.current).forEach(([key, value], index) => {
                // Avoid doing this for the last item in the Collection
                if (index + 1 !== this.current.size) {
                    const nextData = this.current.at(index + 1)!;
                    this.current.set(key, nextData - value);
                }
            });

            this.current.set('start', end - total);
            this.current.set('total', total);
        }

        const latestTimestamp = this.dataPoints[0]?.get('_timestamp');

        if (latestTimestamp && Date.now() > latestTimestamp + this.interval) {
            this.current.set('_timestamp', Date.now());
            this.dataPoints.push(this.current);
            this.dataPoints.length = this.maxDataPoints;
        }

        this.latest = this.current.clone();

        this.current.clear();
    }
}
