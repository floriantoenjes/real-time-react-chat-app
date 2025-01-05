import { undefined } from 'zod';

export function returnEntityOrNotFound<T>(entity: T | null | undefined) {
    if (!entity) {
        return {
            status: 404 as const,
            body: null,
        };
    }

    return {
        status: 200 as const,
        body: entity,
    };
}
