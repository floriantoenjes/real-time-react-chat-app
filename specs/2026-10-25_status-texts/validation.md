# Status Texts & Live Profile Updates - Validation

## Validation Strategy

### 1. Unit Test Validation

#### UserService Tests
```bash
cd backend && npm run test -- user.service.spec.ts
```

**New Tests to Add:**
- [ ] `updateStatusText()` stores the trimmed text on the user
- [ ] `updateStatusText()` with an empty string clears the status
- [ ] `updateStatusText()` strips line breaks
- [ ] `updateStatusText()` throws `UserNotFoundException` for an unknown user
- [ ] `updateStatusText()` clears the `findUsersBy` cache
- [ ] `updateStatusText()` emits `USER_PROFILE_UPDATED` with `{ userId, statusText }`
- [ ] `updateUserAvatar()` emits `USER_PROFILE_UPDATED` with `{ userId, avatarUpdated: true }`

#### Contract Validation
- [ ] Body with 141 characters is rejected (400)
- [ ] Body with surrounding whitespace is trimmed before the length check

#### Existing Tests
```bash
cd backend && npm run test
```
- [ ] All existing backend unit tests pass

### 2. E2E Validation

```bash
npm run e2e:infra
npm run e2e
```

#### New: `e2e/tests/profile/status-text.spec.ts`
- [ ] Alice sets a status text → success snackbar, text persists after reload of her own page
- [ ] Bob (contact) opens Alice's drawer → sees the status text **without reloading**
- [ ] With Alice's drawer already open in Bob's browser, Alice changes the text → Bob's drawer updates live
- [ ] Alice clears her status → Bob's drawer no longer shows a status
- [ ] A group's drawer shows no status text
- [ ] A user who doesn't have Alice as a contact receives no update (if testable via socket listener / no UI change)

#### Modified: `e2e/tests/profile/avatar.spec.ts`
- [ ] Bob sees Alice's new avatar in the contact list **without** `page.reload()`
- [ ] Bob's open chat top bar avatar updates as well

#### Existing Tests
- [ ] Full e2e suite passes (incl. `responsive/mobile.spec.ts` – drawer layout on small screens)

### 3. Manual Validation
- [ ] Status text input usable on mobile width, drawer layout not broken
- [ ] Long status (140 chars) wraps cleanly in both drawers
- [ ] Text with HTML (`<b>hi</b>`) is shown literally
- [ ] German translation shown when language is switched
- [ ] Two tabs of the same user: change in one updates the other
- [ ] Avatar update shows the new image (not a cached old one) for contacts

### 4. Lint & Build
```bash
npm run build
cd frontend && npm run lint
cd backend && npm run lint
```
- [ ] No lint errors, both workspaces build

## Acceptance Criteria
- All checkboxes in `requirements.md` are satisfied
- All unit and e2e tests pass
- No existing socket message types, routes or payloads changed
