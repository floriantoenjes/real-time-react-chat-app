# Playwright E2E Tests - Validation

## Validation Strategy

### 1. Migration Validation
```bash
# No Cypress traces left
git grep -i cypress -- ':!specs' ':!package-lock.json'   # → no results
npm ls cypress                                            # → (empty)
```
- [x] `cypress/` and `cypress.config.ts` deleted
- [x] `package-lock.json` updated (no cypress, has @playwright/test)
- [x] `.gitignore` covers `test-results/`, `playwright-report/`, `blob-report/`, `e2e/.auth/`

### 2. Local Run
```bash
npm run e2e:infra        # docker compose up -d (mongo rs0, redis, s3mock)
npm run e2e              # starts backend + frontend via webServer, runs suite
npm run e2e:report       # open HTML report
```
- [ ] Suite is green on a fresh checkout with only docker + node installed (plus `backend/.env` from `.example.env`). Not verified yet; the CI workflow (`.github/workflows/e2e.yaml`) covers this once it runs.
- [x] Suite is green locally (backend started with `E2E_THROTTLE_MULTIPLIER` when reused)
- [ ] With infra down, globalSetup fails within a few seconds and gives a clear message. Not verified. Note: Playwright starts the `webServer`s before `globalSetup`, so with infra down the backend fails to boot first and the run ends with a webServer timeout instead.

### 3. Stability
```bash
npx playwright test --repeat-each=3 --workers=4
npx playwright test --grep-invert @chromium-only --project=firefox   # optional
```
- [x] 0 failures over 3 repetitions (`--repeat-each=3 --workers=4`)
- [x] `grep -rn "waitForTimeout" e2e/` → only the audio recording duration in `messaging/media.spec.ts` (deliberate: a recording needs real elapsed time; not used for synchronisation)
- [x] No test depends on execution order (`fullyParallel` + repeated runs)

### 4. Throttling Isolation
- [x] The full suite never returns "Too many requests" outside `throttle.spec.ts`
- [x] `throttle.spec.ts` shows the rate-limit message for a (mocked) 429
- [x] With `E2E_THROTTLE_MULTIPLIER` unset or invalid the backend uses the original limits (`throttle-multiplier.config.spec.ts`)

### 5. Coverage Checklist
Every requirement in `requirements.md` → "Feature coverage" maps to at least one test:

| Area | Spec file | Status |
|---|---|---|
| Register / login / logout / session | `auth/*.spec.ts` | ✅ |
| Auth throttling | `auth/throttle.spec.ts` | ✅ |
| Contact search / add / filter / delete | `contacts/contacts.spec.ts` | ✅ |
| Contact request accept | `contacts/contact-request.spec.ts` | ✅ |
| 1:1 messaging live + history + delete | `messaging/direct-messages.spec.ts` | ✅ |
| Read receipts + typing indicator | `messaging/read-receipts-typing.spec.ts` | ✅ |
| Image + audio messages | `messaging/media.spec.ts` | ✅ |
| Group create + messaging | `groups/groups.spec.ts` | ✅ |
| Leave / left list / rejoin | `groups/left-groups.spec.ts` | ✅ |
| Ignore / un-ignore | `relationships/ignore.spec.ts` | ✅ |
| Avatar upload | `profile/avatar.spec.ts` | ✅ |
| Online status + call button state | `presence/online-status.spec.ts` | ✅ |
| Language switch + persistence | `i18n/language.spec.ts` | ✅ |
| Mobile layout | `responsive/mobile.spec.ts` | ✅ |

### 6. Non-Regression
```bash
cd backend && npm test          # unit tests still green
cd frontend && npm run lint     # selector/i18n additions lint-clean
cd frontend && npm run build    # typesafe-i18n types regenerated, build passes
```
- [ ] Added `aria-label`s / `data-testid`s cause no visual changes (manual check in desktop + mobile view). Not checked manually; the attributes don't affect styling.
- [x] Backend unit tests green (33)
- [x] Frontend lint: no new errors. The 18 existing errors are identical on `main`.
- [ ] Frontend production build (`npm run build`) not run as part of this work; `tsc --noEmit` shows only the existing `reportWebVitals.ts` errors
- [x] No REST/WS contract changes (`git diff main -- backend/shared` is empty)

### 7. Bugs Found
Application bugs that tests uncovered. All of them are fixed; each former `test.fixme` is now a regular regression test.
- **Live read receipt missing when the recipient opens the chat later.** `MessageService.getMessages()` (`backend/src/modules/message/message.service.ts`) marks the fetched messages read, but emits `MESSAGE_READ` with `messageAuthorId: userId`, which is the *reader*. `SocketGateway` sends the event to `messageAuthorId`, so the sender never gets it and only sees the read tick after a reload. `markMessageRead()` passes the real author (`fromUserId`). **Fixed:** `messageAuthorId: message.fromUserId.toString()`, plus a unit test in `message.service.spec.ts`. Regression test in `messaging/read-receipts-typing.spec.ts`.
- **Message corrupted when sent before the chat history has loaded.** `useMessageSending.sendMessage()` (`frontend/src/shared/hooks/useMessageSending.ts`) adds a temporary message, then replaces it *by array index* when the server responds. If `useMessageCache` sets the fetched history in between, the index points at a different or missing entry and `{...undefined, _id, sent}` is written into the list. It renders as ":" with "Invalid DateTime". **Fixed:** the temporary message is replaced by its temp `_id`, using functional state updates; it is dropped if the loaded history already contains the real message. `useMessageCache` merges messages of the chat that arrived while the history was loading instead of overwriting them. Regression test in `messaging/direct-messages.spec.ts`.
- **Concurrent messages between the same two users fail.** `MessageService.sendMessage()` (`backend/src/modules/message/message.service.ts`) uses a manual transaction (`startTransaction`/`commitTransaction`) that writes both users' documents, with no retry for transient errors. Two simultaneous sends conflict and the second returns a generic error ("An error occurred"). Seen in the e2e run (screenshot); the cause was inferred from the code. **Fixed:** `session.withTransaction(...)` retries transient errors, and sender and receiver are read inside the transaction so every attempt uses fresh documents; events are only emitted for the committed attempt. Unit test for the retry in `message.service.spec.ts`, regression test in `messaging/direct-messages.spec.ts`.
- **Live-added group named differently than after a reload (fixed).** When a group's first message arrives, `MessageService.sendMessage()` names the `CONTACT_GROUP_AUTO_ADD` group from `memberRefs` in member-id order **without sorting**. `ContactGroupService.computeGroupNamesForUser()`, used everywhere else, sorts the names. A member can see "Zora, Abe" live and "Abe, Zora" after a reload. **Fixed:** the names are sorted like in `computeGroupNamesForUser()`, plus a unit test in `message.service.spec.ts`. Regression test in `groups/groups.spec.ts`.
- **User menu stays open after the language modal (fixed).** `useSidebarTopSectionUI.showLanguageModal()` (`frontend/src/shared/hooks/useSidebarTopSectionUI.ts`) opens the modal without calling `handleClose()`, unlike the drawer entries that go through `toggleDrawer()`. After closing the modal, the user menu is still open. **Fixed:** `showLanguageModal()` calls `handleClose()`. Regression test in `i18n/language.spec.ts`; the Escape workaround is removed.
- **Un-ignored contact differs between UI and server (fixed).** Ignoring a user removes the contact on the server (`IgnoredUserService.removeContactFromUserEntity()`), but the frontend keeps it in `ContactsContext` and only hides it through `ignoredUserIds`. After un-ignoring, the UI shows the old *accepted* contact again; after a reload it is gone, and the user's next message arrives as a new contact request. **Decided and fixed:** the frontend follows the server. `ContactsContext` removes the contact (and deselects it) on the `userIgnored` socket event, which reaches all of the user's sessions. `relationships/ignore.spec.ts` asserts it without a reload.

### 8. Accessibility Observations
Not counted as bugs, but found while writing the tests:
- While a drawer or menu is open, MUI marks the rest of the page `aria-hidden`, including the snackbar. Screen readers don't announce snackbars shown in that state (e.g. "You have rejoined …"). The e2e snackbar helper uses `includeHidden: true` because of this.
- After rejoining a group or un-ignoring a user in a drawer, the focused list entry is removed and focus falls back to `<body>`, so Escape no longer closes the drawer. `Sidebar.closeDrawer()` clicks the backdrop instead.

## Success Criteria
1. Cypress is gone and `npm run e2e` runs a green Playwright suite locally
2. All features except voice/video calls are covered per the table above
3. The suite is stable across repetitions and parallel workers
4. Production throttling/auth behaviour is unchanged
