# Ignore Users Feature - Validation

## Success Criteria

### Backend
- [ ] POST `/contact-requests/{id}/ignore` endpoint created and functional
- [ ] DELETE `/ignored-users/{userId}` endpoint created and functional
- [ ] GET `/ignored-users` endpoint returns paginated list of ignored users
- [ ] Message creation rejects messages from ignored users (403 Forbidden)
- [ ] Contact request creation rejects requests from ignored users (403 Forbidden)
- [ ] Ignore status check is O(1) or O(log n) via efficient data structure
- [ ] WebSocket event emitted when user is ignored/un-ignored
- [ ] All new endpoints have ts-rest contracts and Zod validation

### Frontend
- [ ] "Ignore" button visible on incoming contact request cards
- [ ] "Ignore" button visible on user profile/model when viewing non-contact
- [ ] "Ignored Users" section/list accessible from settings or contacts
- [ ] "Un-ignore" action available on ignored user entries
- [ ] Visual feedback (toast/snackbar) on ignore/un-ignore actions
- [ ] Real-time UI updates when ignore status changes (via WebSocket)
- [ ] Confirmation dialog before ignoring a user
- [ ] Messages from ignored users do not appear in chat
- [ ] Contact requests from ignored users do not appear in requests list

### Database
- [ ] `ignoredUsers` collection created with `IgnoredUserEntity` schema
- [ ] Compound unique index on `(userId, ignoredUserId)` prevents duplicate ignores
- [ ] Individual indexes on `userId` and `ignoredUserId` for fast queries
- [ ] Schema registered in `app.module.ts`

## Test Cases

### Unit Tests
- [ ] Backend service: ignoreUser adds to ignore list
- [ ] Backend service: unignoreUser removes from ignore list
- [ ] Backend service: isUserIgnored returns correct boolean
- [ ] Backend service: cannot ignore self
- [ ] Backend middleware: rejects messages from ignored users
- [ ] Backend middleware: rejects contact requests from ignored users

### Integration Tests
- [ ] Full flow: User A sends request → User B ignores → User A cannot send another request
- [ ] Full flow: User A ignored by User B → User A's messages to User B are rejected
- [ ] Full flow: User B un-ignores User A → User A can send contact request again
- [ ] Real-time: WebSocket event received when user is ignored

### E2E Tests
- [ ] UI: Ignore button on contact request works end-to-end
- [ ] UI: Ignored user cannot send message (error shown)
- [ ] UI: Un-ignore flow works end-to-end
- [ ] UI: Ignored users list displays correctly

## Merge Criteria

- [ ] All tests pass (unit, integration, E2E)
- [ ] TypeScript compilation succeeds with no errors
- [ ] No breaking changes to existing API contracts
- [ ] Database migrations (if any) are backward compatible
- [ ] Feature works in development environment
- [ ] Code review completed
- [ ] Documentation updated (API docs, if applicable)
