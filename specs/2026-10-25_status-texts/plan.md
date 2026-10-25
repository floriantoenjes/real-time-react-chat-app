# Status Texts & Live Profile Updates - Plan

## Overview
Let users set a short status text that is shown in their profile drawer and in the contact drawer other users open from the chat top bar. In addition, push profile changes (status text and avatar) to contacts in real time, so nobody has to reload to see a new avatar or status.

Today the own-profile drawer (`UserProfile.tsx`) only edits the avatar, and the contact drawer (inline in `TopBar.tsx`) only shows avatar and name. Contacts get the avatar bytes once at login (`ContactService.getContacts` → `UserFactory.createUserWithAvatarBytes`), so avatar changes only become visible after a reload.

## Phases

### Phase 1: Backend Status Text (Est: 1-2 hours)
- [x] Add `statusText: z.string().optional()` to `UserSchema` and `ContactSchema`
- [x] Add `updateStatusText` route to `userContract`:
  `PATCH /users/status-text`, body `z.object({ statusText: z.string().trim().max(140) })`, responses `200: UserSchema`
- [x] Add `@Prop() statusText?: string` to `UserEntity`
- [x] Add `UserService.updateStatusText(userId, statusText)` (reuses `updateUser`, which clears the `findUsersBy` cache; strip line breaks)
- [x] Add controller handler with `@UserId()` and `@StrictThrottle()`
- [x] Include `statusText` in the contacts built in `ContactService.addContact` (both directions)
- [x] Optional: give the seeded demo users a status text in `init.service.ts`

**Files:**
- `backend/shared/user.contract.ts`
- `backend/shared/contact.contract.ts`
- `backend/src/modules/user/user.schema.ts`
- `backend/src/modules/user/user.service.ts`
- `backend/src/modules/user/user.controller.ts`
- `backend/src/modules/relationships/contact/contact.service.ts`
- `backend/src/modules/init/init.service.ts` (optional)

### Phase 2: Backend Live Profile Updates (Est: 1-2 hours)
- [x] Add `EventNames.USER_PROFILE_UPDATED = 'user.profile-updated'`
- [x] Add `UserProfileUpdatedEvent { userId: string; statusText?: string; avatarUpdated?: boolean }` to `user.events.ts`
- [x] Add `SocketMessageTypes.contactProfileUpdated = 'contactProfileUpdated'`
- [x] Add shared payload type `ContactProfileUpdate { userId, statusText?, avatarUpdated? }` (in `backend/shared`, so the frontend can use it)
- [x] Inject `EventBusService` into `UserService`; emit the event at the end of `updateStatusText` and `updateUserAvatar`
- [x] Handle the event in `SocketGateway`: `getUsersThatHaveContact(userId)` → `server.to([...contactIds, userId]).emit(contactProfileUpdated, payload)`
- [x] Wrap the handler in try/catch + log, like the existing handlers

**Files:**
- `backend/src/events/event-names.enum.ts`
- `backend/src/events/user.events.ts`
- `backend/shared/socket-message-types.enum.ts`
- `backend/shared/user.contract.ts` (payload type)
- `backend/src/modules/user/user.service.ts`
- `backend/src/modules/socket-gateway/socket.gateway.ts`
- `backend/src/modules/user/user.module.ts` (only if `EventBusService` isn't available through the global module)

### Phase 3: Frontend Edit Own Status (Est: 1-2 hours)
- [x] Add `UserService.updateStatusText(statusText)`
- [x] Add MUI `TextField` below the avatar in `UserProfile.tsx` (prefilled with `user.statusText`, `maxLength` 140, character counter, save via button / Enter)
- [x] On success: `setUser({ ...user, statusText })` + success snackbar; on error: error snackbar
- [ ] Show own status text below the username in the sidebar top section (optional; skipped for now, the top section only shows the avatar, no username)
- [x] Add i18n keys (en + de) and regenerate typesafe-i18n:
  `STATUS_TEXT`, `STATUS_TEXT_PLACEHOLDER`, `SAVE_STATUS_TEXT`, `STATUS_TEXT_UPDATED`, `ERROR.STATUS_TEXT_NOT_UPDATED`

**Files:**
- `frontend/src/shared/services/UserService.ts`
- `frontend/src/dashboard/sidebar/top-section/user-profile/UserProfile.tsx`
- `frontend/src/dashboard/sidebar/top-section/TopSection.tsx` (optional)
- `frontend/src/i18n/en/index.ts`, `frontend/src/i18n/de/index.ts`, generated `i18n-types.ts`

### Phase 4: Frontend Show Contact Status (Est: 0.5-1 hour)
- [x] Render `selectedContact.statusText` below the avatar in the `TopBar` drawer when `!isContactGroup(selectedContact)` and the text is not empty
- [x] Add `data-testid="contact-status-text"` for e2e tests

**Files:**
- `frontend/src/dashboard/chat/top-bar/TopBar.tsx`

### Phase 5: Frontend Live Profile Updates (Est: 1-2 hours)
- [x] Listen for `contactProfileUpdated` in `ContactsContext` (next to `contactAutoAdded`, with `socket.off` cleanup)
- [x] Add a helper that applies an update to a contact:
  - set `statusText` if present in the payload
  - if `avatarUpdated`: set `avatarFileName = userId + "_avatar"` and reload bytes via `userService.loadAvatar(userId)`
- [x] Apply it to `contacts` (functional `setContacts`) and to `selectedContact` when its `_id` matches
- [x] If `payload.userId === user._id` (other own session): update `UserContext` the same way
- [x] Ignore updates for unknown contacts

**Files:**
- `frontend/src/shared/contexts/ContactsContext.tsx`
- ~~possibly `frontend/src/shared/contexts/UserContext.tsx`~~ (not needed, `setUser` from the context is used)

### Phase 6: Testing & Validation (Est: 1-2 hours)
- [x] Backend unit tests for `updateStatusText` and event emission (see validation.md)
- [x] E2E spec `e2e/tests/profile/status-text.spec.ts`
- [x] Extend `e2e/tests/profile/avatar.spec.ts`: Bob sees Alice's new avatar without `reload()`
- [x] Add `setStatusText()` and contact-drawer helpers to the dashboard page object
- [ ] Run lint, unit tests and full e2e suite (lint, type checks and backend unit tests pass; e2e not run yet, Docker is blocked in the agent sandbox)

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/shared/user.contract.ts` | MODIFY | `statusText` field, `updateStatusText` route, `ContactProfileUpdate` type |
| `backend/shared/contact.contract.ts` | MODIFY | `statusText` field |
| `backend/shared/socket-message-types.enum.ts` | MODIFY | `contactProfileUpdated` |
| `backend/src/events/event-names.enum.ts` | MODIFY | `USER_PROFILE_UPDATED` |
| `backend/src/events/user.events.ts` | MODIFY | `UserProfileUpdatedEvent` |
| `backend/src/modules/user/user.schema.ts` | MODIFY | `statusText` prop |
| `backend/src/modules/user/user.service.ts` | MODIFY | `updateStatusText`, emit profile event (status + avatar) |
| `backend/src/modules/user/user.controller.ts` | MODIFY | `updateStatusText` handler |
| `backend/src/modules/user/user.service.spec.ts` | MODIFY | New tests |
| `backend/src/modules/relationships/contact/contact.service.ts` | MODIFY | `statusText` in `addContact` |
| `backend/src/modules/socket-gateway/socket.gateway.ts` | MODIFY | Broadcast `contactProfileUpdated` |
| `frontend/src/shared/services/UserService.ts` | MODIFY | `updateStatusText()` |
| `frontend/src/dashboard/sidebar/top-section/user-profile/UserProfile.tsx` | MODIFY | Status text input |
| `frontend/src/dashboard/chat/top-bar/TopBar.tsx` | MODIFY | Show contact status |
| `frontend/src/shared/contexts/ContactsContext.tsx` | MODIFY | Handle `contactProfileUpdated` |
| `frontend/src/i18n/{en,de}/index.ts` | MODIFY | New strings |
| `e2e/pages/dashboard.page.ts` | MODIFY | Helpers |
| `e2e/tests/profile/status-text.spec.ts` | CREATE | Status text e2e |
| `e2e/tests/profile/avatar.spec.ts` | MODIFY | Live avatar update |

## Risk Assessment

### Low Risk
- Additive optional fields on contracts and schema
- New endpoint and UI input
- Rendering the status text in the drawer

### Medium Risk
- `getUsersThatHaveContact()` query per profile update (fine for status/avatar frequency; throttled endpoint limits abuse)
- `selectedContact` is a separate copy of the contact; forgetting to patch it leaves the open drawer stale
- Avatar bytes: same file name after update, so any caching of `loadAvatar` responses (browser / HTTP cache headers) could serve the old image. Verify; if needed append a cache-busting query param or `Cache-Control: no-cache`
  - Checked in Phase 2: `loadAvatar` is a JSON response without `Cache-Control`/`Last-Modified`, only Express' default `ETag`, so the browser revalidates and gets the new bytes. Confirm with the e2e test in Phase 6

### Mitigation
- Reuse existing event bus / gateway patterns (`USER_IGNORED`, `CONTACT_ADDED`)
- E2E tests cover the open-drawer case and avatar update without reload

## Rollback Strategy
- Feature is additive; reverting the commits removes it
- `statusText` stays in existing user documents harmlessly if rolled back
- Live updates can be disabled by removing the gateway handler alone
