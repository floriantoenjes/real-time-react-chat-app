# Plan: Replace Cypress with Playwright and Add E2E Coverage

## Overview
The current Cypress setup has one spec file (`cypress/e2e/spec.cy.ts`) with two tests: a long "happy path" and a sign-in throttle check. It relies on `cy.wait(1000)`, a hard-coded user, and a seeded DB state. This plan replaces it with a Playwright suite that runs fully locally (docker-compose infra + `nest start` + `vite`) and covers every feature except voice/video calls.

## Current State Analysis

**Cypress (to be removed):**
- `cypress.config.ts`, `cypress/e2e/spec.cy.ts`, `cypress/fixtures/example.json`, `cypress/support/{commands,e2e}.ts`
- root `package.json`: `"cypress": "^13.15.2"` devDependency, `"cy:open"` script

**Leftovers from an earlier Playwright attempt (untracked, empty):**
- `e2e/{artifacts,fixtures,tests,utils}/`: empty directories, will be reused or replaced
- `test-results/`: empty per-test folders, delete

**Runtime facts that shape the design:**
- Frontend: Vite on `http://localhost:5173`, `base: "/frontend/"`, routes `/` (login), `/register`, `/dashboard`
- Backend: Nest on `:4200` (REST + Socket.io), PeerJS on `:9000`, CORS origin `http://localhost:5173`
- Auth: HTTP-only `accessToken`/`refreshToken` cookies + a localStorage "signed in" flag (`AuthService.LOCAL_STORAGE_SIGNED_IN_FLAG`)
- Language: localStorage `language` (`en` | `de`)
- `InitService.onApplicationBootstrap` **wipes the DB and Redis cache on every backend start** and seeds Florian/Alex/Tom/Stella (`password`). This gives a clean slate per run, but tests must still be isolated *within* a run.
- Throttling:
  - `@AuthThrottle`: 5 req / 15 min on auth endpoints
  - global: 100 req / min
  - WS connections: 10 / min per IP
  - All of them track by `x-forwarded-for` when present, otherwise by IP. A suite where every test logs in from 127.0.0.1 hits the auth limit after 5 logins.
- Almost no stable selectors exist (`.send-message-bar`, `.send-message-button`, `.send-audio-button`, `name=chat-menu-button`, `#group-members-input`). Most things are icon buttons without labels.

## Key Design Decisions

### D1. Throttling strategy
> **Decided in Phase 1 → D1b.** The per-test `x-forwarded-for` probe failed: the frontend calls the backend
> cross-origin (`:5173` → `:4200`, `credentials: "include"`), so the extra header triggers a CORS preflight and the
> backend's `allowedHeaders` rejects it, which blocks the login. Allowing the header in CORS just for tests was
> rejected. Implemented instead:
> - `backend/src/config/throttle-multiplier.config.ts`: `E2E_THROTTLE_MULTIPLIER` (process env, integer ≥ 1, default 1)
>   scales the auth/strict/global REST limits and the WS connection/message limits. Unit-tested.
> - Playwright's backend `webServer` sets it to `100`. A backend you start yourself for `reuseExistingServer`
>   needs it too: `E2E_THROTTLE_MULTIPLIER=100 npm run start:backend`.
> - `auth/throttle.spec.ts` mocks a 429 from `/login` and asserts the UI message, so the e2e suite covers how the
>   frontend handles throttling. The limits themselves are no longer covered end to end.
>
> Original options, kept for reference:

**Originally recommended:** give each test its own fake client IP by setting `extraHTTPHeaders: { 'x-forwarded-for': <unique ip> }` on every browser context and `APIRequestContext` the fixtures create. Each test then gets its own throttle budget, and the real limits stay active, so the throttle test still exercises production behaviour.
- **Verify in Phase 1** that Playwright sends `extraHTTPHeaders` on the Socket.io handshake (polling XHR definitely; WS upgrade in Chromium should). If the WS upgrade doesn't carry it, fall back to D1b.
- **D1b (fallback):** an opt-in env var `E2E_THROTTLE_MULTIPLIER` (default `1`) read in `throttle.decorators.ts`, `app.module.ts` and `ws-throttle.config.ts`. The e2e `webServer` sets it to e.g. `100`. The throttle test then needs its own lower limit, or it gets skipped under the multiplier.
- ⚠️ Side note, not in scope: trusting a client-supplied `x-forwarded-for` lets anyone bypass the rate limits in production unless the ingress (Traefik) overwrites the header. That is worth a separate check.

### D2. Users and auth
- Fixture `createUser()` registers a fresh user through the REST API (`POST /register`, then `POST /login`) using `APIRequestContext`. The returned cookies are injected into a new `BrowserContext`, and `addInitScript` sets the localStorage signed-in flag and `language=en`.
- Only the auth specs drive the login/register UI. All other specs start already signed in, which is fast and keeps auth-endpoint usage low.
- Unique identity per user: `` `e2e-${testInfo.workerIndex}-${Date.now()}-${n}` ``. Usernames must be unique because contacts are added by username search.

### D3. Multi-user tests
Real-time features (messages, receipts, typing, online status, groups, ignore) need two or three users at once. A fixture `actors` gives `alice`, `bob` and `carol`, each with its own `BrowserContext` + `Page` + a Page Object, created lazily, so single-user tests don't pay for them.

### D4. Page Objects
Thin page objects keep selectors in one place:
- `LoginPage`, `RegisterPage`
- `DashboardPage` → `Sidebar` (contact search, contact list, user menu, ignored users, left groups), `ChatView` (top bar + menu, message list, send bar), `GroupCreationDialog`, `LanguageModal`, `ProfileDialog`

### D5. Selectors (frontend changes)
Add `aria-label`s to icon-only buttons first, since they also improve accessibility. Add `data-testid` only where no accessible name fits. Planned additions:
| Component | Element | Selector to add |
|---|---|---|
| `SendMessageBar.tsx` | plus / send / mic / stop buttons | `aria-label` (i18n) |
| `TopBar.tsx` | back, video, phone, menu buttons; typing text | `aria-label`; `data-testid="typing-indicator"` |
| `Message.tsx` | message bubble; read icon | `data-testid="chat-message"`, `data-testid="message-read"` |
| `Contact.tsx` | list item; online dot; last message | `data-testid="contact"`, `data-contact-name`, `data-testid="online-indicator"` |
| `TopSection.tsx` | user menu, language button | `aria-label` |
| `UserProfile.tsx` | avatar file input | `data-testid="avatar-input"` |
| `ContactRequest.tsx` | accept prompt | role-based is probably enough |
New i18n keys go into both `en` and `de`, and `npm run typesafe-i18n` regenerates the types.

### D6. Media
- Images: `page.setInputFiles()` on the hidden `<input type=file>` with fixtures in `e2e/fixtures/` (`small.png`, `not-an-image.txt`)
- Audio: Chromium launch args `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream` + `permissions: ['microphone']`. Audio tests are tagged `@chromium-only`.

## Target Layout
```
playwright.config.ts
e2e/
  fixtures/            # static files: small.png, avatar.png, not-an-image.txt
  support/
    test.ts            # extended `test` with users/actors/api fixtures
    api.ts             # REST helpers (register, login, addContact, sendMessage) for fast setup
    ids.ts             # unique email/username/ip generators
  pages/               # page objects (D4)
  tests/
    auth/register.spec.ts
    auth/login.spec.ts
    auth/session.spec.ts
    auth/throttle.spec.ts
    contacts/contacts.spec.ts
    contacts/contact-request.spec.ts
    messaging/direct-messages.spec.ts
    messaging/read-receipts-typing.spec.ts
    messaging/media.spec.ts
    groups/groups.spec.ts
    groups/left-groups.spec.ts
    relationships/ignore.spec.ts
    profile/avatar.spec.ts
    presence/online-status.spec.ts
    i18n/language.spec.ts
    responsive/mobile.spec.ts
```

## Implementation Plan

### Phase 1: Remove Cypress, scaffold Playwright
**Task 1.1:** Delete `cypress/`, `cypress.config.ts`, the `cypress` devDep and the `cy:open` script. Delete the stale `test-results/` and the empty `e2e/*` subfolders.
**Task 1.2:** `npm i -D @playwright/test` at root, then `npx playwright install chromium`.
**Task 1.3:** `playwright.config.ts`:
- `testDir: 'e2e/tests'`, `fullyParallel: true`, `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? 2 : undefined`
- `use: { baseURL: 'http://localhost:5173/frontend/', trace: 'on-first-retry', video: 'retain-on-failure', screenshot: 'only-on-failure' }`
- projects: `chromium` (with fake-media args), `mobile-chromium` (Pixel 7, only `responsive/`), `firefox` (opt-in via `E2E_ALL_BROWSERS=1`, `grepInvert: /@chromium-only/`)
- `webServer`: `[ { command: 'npm run start:backend', url: 'http://localhost:4200/<health>', reuseExistingServer: !CI, timeout: 120s }, { command: 'npm run start:frontend -- --open=false', url: 'http://localhost:5173/frontend/', reuseExistingServer: !CI } ]`
  - Check which backend route makes a cheap health probe (`AppController` GET). If none exists, add a `@SkipThrottle()`/`@Public` GET `/health`.
  - Vite `--open` must not open a browser during tests, so pass `--open=false` or add a `start:e2e` script.
- `globalSetup`: fail fast with a helpful message if Mongo/Redis/s3mock are unreachable ("run `docker compose -f local-development/docker-compose.yaml up -d`")
**Task 1.4:** root scripts: `e2e`, `e2e:ui`, `e2e:headed`, `e2e:report`, `e2e:infra` (docker compose up -d). Extend `.gitignore`.
**Task 1.5:** Write a smoke test that loads the login page, then make the D1 decision: verify that `x-forwarded-for` reaches both throttlers for REST and Socket.io. Implement D1b if it doesn't. ✅ Done → D1b

### Phase 2: Test infrastructure
**Task 2.1:** `e2e/support/ids.ts`: unique email/username generators (IPs dropped with D1b). ✅
**Task 2.2:** ✅ `e2e/support/api.ts`: register/login through `request.newContext({ baseURL: 'http://localhost:4200', extraHTTPHeaders })`, plus helpers for setup shortcuts (add contact, create group, send message) through the ts-rest endpoints. Reuse the contract types from `backend/shared/*.contract.ts` where the import path works.
**Task 2.3:** ✅ `e2e/support/test.ts`: `test.extend` with `createUser`, `signedInPage`, `actors` (D2/D3), and auto-close of all contexts it created.
**Task 2.4:** ✅ Frontend selector additions (D5) + i18n keys. Regenerating `i18n-types.ts` also added the previously missing Left Groups keys.
**Task 2.5:** ✅ Page objects (D4): `e2e/pages/auth.page.ts`, `e2e/pages/dashboard.page.ts`.

### Phase 3: Auth & session specs
- register: success → redirected/snackbar "Your account has been created"; passwords don't match; invalid email; min-length/strength hint; email already taken error
- login: success → dashboard; wrong password / unknown email → "Email or password incorrect"
- session: reload stays signed in; `/dashboard` while signed out → login; sign out → "You have been logged out successfully" and the protected route is blocked again
- throttle: mocked 429 on `/login` → "Too many requests in a short period of time" (done in Phase 1, see D1)

### Phase 4: Contacts & messaging specs
- contacts: search by username shows "`<name>` (add)", adding shows the snackbar, the list filter narrows results, delete chat removes the contact
- contact request: bob messages alice (who has not added bob) → alice sees the accept question → accept → messaging enabled snackbar
- direct messages: Enter and send button both work; alice → bob arrives live; last-message preview in bob's list; history after reload; delete messages → "Chat messages have been deleted"
- read receipts / typing: bob opens the chat → alice sees the read icon; alice types → bob sees "is typing..."
- media: image upload → bob sees "Image message" preview → "Show Image" renders `<img>`; invalid type rejected; audio record → stop → audio element present for both (`@chromium-only`)

### Phase 5: Groups, ignore, profile, presence, i18n, responsive
- groups: "You need at least two contacts to create a group" with fewer than 2 contacts; create a group with bob + carol; group message reaches both
- left groups: carol leaves → "You have left the group …" → listed under "Left Groups" → alice sends → carol does not receive it and the group does not reappear → rejoin → next message arrives (the validation scenario from `specs/2026-06-21_left-groups`)
- ignore: alice ignores bob (confirm dialog) → listed under "Ignored Users" → bob's message doesn't reach alice → un-ignore (confirm) → messages arrive again
- avatar: upload PNG → "Your profile picture has been updated"; avatar `<img>` src changes; bob sees the new avatar after reload
- online status: bob online → indicator on in alice's list and call buttons enabled; close bob's context → offline and call buttons disabled
- i18n: switch to Deutsch → German labels; reload → still German
- responsive (`mobile-chromium`): welcome message visible, open a chat → back button returns to the list

### Phase 6: Stabilize & document
**Task 6.1:** `npx playwright test --repeat-each=3 --workers=4` must be green. Fix flakiness at the root, not with retries.
**Task 6.2:** README section "E2E tests" (prereqs, commands, how to debug with UI mode/trace viewer).
**Task 6.3 (nice to have):** `.github/workflows/e2e.yaml` on `pull_request`: Node setup, `docker compose up -d --wait`, a backend `.env` built from `.example.env` with test secrets, `npx playwright install --with-deps chromium`, `npm run e2e`, upload `playwright-report/`.

## Risks / Open Questions
- **Backend `.env` for tests:** the suite assumes the developer's existing `backend/.env` points at docker-compose. CI needs a committed `e2e.env` or values generated in the workflow.
- **DB wipe on boot:** convenient, but with `reuseExistingServer` the data from earlier runs piles up. Unique IDs make that harmless.
- **Access token TTL is 600s:** long tests are fine, and the refresh flow gets exercised implicitly.
- **Bugs surfaced by tests:** any real bug found gets a `test.fixme` with a note and is listed in `validation.md`. Bugs are not fixed silently as part of this work.
