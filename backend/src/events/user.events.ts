export interface UserCreatedEvent {
    authUserId: string;
    username: string;
}

export interface UserIgnoredEvent {
    userId: string;
    ignoredUserId: string;
}

export interface UserUnignoredEvent {
    userId: string;
    unignoredUserId: string;
}
