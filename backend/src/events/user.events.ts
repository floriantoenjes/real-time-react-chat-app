export interface UserIgnoredEvent {
    userId: string; // User who did the ignoring
    ignoredUserId: string;
}

export interface UserUnignoredEvent {
    userId: string;
    unignoredUserId: string;
}
