export interface EventPayload {
    version: number;
    event: Event;
}

export interface Event {
    type: number;
    data: object;
}

export interface FriendsEvent extends Event {
    data: {
        host: string;
    };
}

export interface FriendsEventPayload extends EventPayload {
    event: FriendsEvent;
}

export interface PlaytimeEvent extends Event {
    data: {
        host: string;
    };
}

export interface PlaytimeEventPayload extends EventPayload {
    event: FriendsEvent;
}
