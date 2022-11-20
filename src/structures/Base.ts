import { container } from '@sapphire/framework';

export class Base {
    public readonly container: typeof container;

    public static readonly container = container;

    public constructor() {
        this.container = container;
    }
}
