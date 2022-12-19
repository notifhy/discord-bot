import { Store } from '@sapphire/framework';
import { Route } from './Route';

export class RouteStore extends Store<Route> {
    public constructor() {
        super(Route, { name: 'routes' });
    }
}
