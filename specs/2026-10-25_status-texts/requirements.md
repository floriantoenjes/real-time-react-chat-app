# Status Texts & Live Profile Updates - Requirements

## Must Have

### Functional Requirements
- [ ] Users can set a status text in their own profile drawer (`UserProfile`)
- [ ] Users can change and clear (empty string) their status text
- [ ] The status text of a contact is shown in the contact's profile drawer (`TopBar` drawer)
- [ ] Contact groups show no status text in their drawer
- [ ] When a user changes their status text, all users that have them as a contact see the new text without reloading
- [ ] When a user changes their avatar, all users that have them as a contact see the new avatar without reloading
- [ ] Live updates also apply to an already opened chat / opened drawer (`selectedContact`)
- [ ] The user's own other open sessions (tabs/devices) receive the update as well
- [ ] Success and error feedback via the existing snackbar, like the avatar upload

### Non-Functional Requirements
- [ ] Status text is trimmed and limited to 140 characters, single line
- [ ] Validation happens in the shared Zod contract (enforced by the backend)
- [ ] Status text is rendered as plain text (no HTML / markdown)
- [ ] The update endpoint is rate limited (`StrictThrottle`)
- [ ] All existing unit and e2e tests must pass
- [ ] No new external dependencies required
- [ ] All new UI strings are translated (en + de)

### Technical Requirements
- [ ] Add optional `statusText` to `UserSchema` and `ContactSchema` (`backend/shared`)
- [ ] Add optional `statusText` prop to `UserEntity`
- [ ] New ts-rest route `userContract.updateStatusText` (`PATCH /users/status-text`)
- [ ] `statusText` is read from the live user document (`getUserContacts` spread), NOT stored on embedded contacts
- [ ] `addContact` includes `statusText` in the contact it builds (used for `contactAutoAdded`)
- [ ] New internal event `USER_PROFILE_UPDATED` emitted via `EventBusService` after status text or avatar changes
- [ ] New socket message type `contactProfileUpdated` emitted by `SocketGateway` to all users returned by `ContactService.getUsersThatHaveContact()` and to the user's own room
- [ ] Frontend `ContactsContext` patches `contacts` and `selectedContact` on `contactProfileUpdated`
- [ ] On an avatar update the frontend re-fetches the avatar bytes (file name stays `<userId>_avatar`, so the bytes must be reloaded)

### Data Model Requirements
- [ ] `users.statusText?: string` (optional, no migration needed)
- [ ] No changes to embedded `contacts` schema or `contactGroups`

## Must Not Have

### Anti-Requirements
- [ ] Do NOT store `statusText` on embedded contact entries (would go stale)
- [ ] Do NOT send the avatar image itself over the socket (only a change notification)
- [ ] Do NOT change existing socket message types or their payloads
- [ ] Do NOT change existing REST routes or response formats (only additive optional fields)
- [ ] Do NOT broadcast profile updates to users that don't have the user as a contact
- [ ] Do NOT introduce new external dependencies

## Constraints
- Zod 3 / NestJS 11 / ts-rest stay as they are (see deferred upgrade decision)
- Must work with the Redis Socket.IO adapter (rooms named after the userId)
- Must keep the `findUsersBy` cache consistent (`updateUser` already clears it)

## Dependencies
- No new dependencies
- Existing infrastructure: `EventBusService`, `SocketGateway`, `ContactService.getUsersThatHaveContact()`, `UserFactory.createUserWithAvatarBytes()`, `snackbarService`, typesafe-i18n
