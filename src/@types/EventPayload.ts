export interface EventPayload {
    domain: string;
    joined?: boolean;
}

export interface FriendsEventPayload extends EventPayload {
    joined: boolean;
}
