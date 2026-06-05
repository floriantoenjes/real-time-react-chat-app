/**
 * Emitted when a user ignores another user
 * Listeners: RealTimeChatGateway (broadcast), ContactService
 */
export interface UserIgnoredEvent {
    userId: string; // User who did the ignoring
    ignoredUserId: string;
}

/**
 * Emitted when a user un-ignores another user
 * Listeners: RealTimeChatGateway (broadcast)
 */
export interface UserUnignoredEvent {
    userId: string;
    unignoredUserId: string;
}

/**
 * Emitted when a user comes online
 * Listeners: OnlineStatusService, RealTimeChatGateway
 */
export interface UserOnlineEvent {
    userId: string;
}

/**
 * Emitted when a user goes offline
 * Listeners: OnlineStatusService, RealTimeChatGateway
 */
export interface UserOfflineEvent {
    userId: string;
}
