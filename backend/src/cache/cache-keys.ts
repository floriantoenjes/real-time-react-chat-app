export function findUsersByCacheKey(filter?: any): string {
    return 'findUsersBy' + JSON.stringify(filter);
}
