export interface EventPayload {
    host: string;
    joined?: boolean;
}

export interface FriendsEventPayload extends EventPayload {
    joined: boolean;
}
