export interface UserIgnoredEvent {
    userId: string;
    ignoredUserId: string;
}

export interface UserUnignoredEvent {
    userId: string;
    unignoredUserId: string;
}
