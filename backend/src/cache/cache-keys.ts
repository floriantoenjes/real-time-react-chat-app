export function findUsersByCacheKey(filter?: any): string {
    return 'findUsersBy' + JSON.stringify(filter);
}

export function getContactGroupsCacheKey(userId: string): string {
    return 'getContactGroups' + userId;
}

export function getUserContactsCacheKey(userId: string): string {
    return 'getUserContacts' + userId;
}
