# Playwright E2E Tests - Requirements

## Must Have

### Migration
- [ ] Cypress is fully removed: `cypress/`, `cypress.config.ts`, the `cypress` devDependency and the `cy:open` script
- [ ] Playwright (`@playwright/test`) is installed as a root devDependency
- [ ] All Playwright code lives in the existing (currently empty) root `e2e/` folder
- [ ] `playwright.config.ts` lives at the repo root
- [ ] Playwright output folders (`test-results/`, `playwright-report/`, `e2e/.auth/`, `blob-report/`) are git-ignored
- [ ] The stale, empty `test-results/` folder from an earlier attempt is deleted

### Running the suite
- [ ] One command runs the whole suite locally: `npm run e2e`
- [ ] Extra scripts: `npm run e2e:ui` (UI mode), `npm run e2e:headed`, `npm run e2e:report`
- [ ] Playwright's `webServer` starts the backend (`:4200`) and frontend (`:5173/frontend`) if they are not already running (`reuseExistingServer: true` locally)
- [ ] Infrastructure (Mongo replica set, Redis, s3mock) comes from the existing `local-development/docker-compose.yaml`. No k8s and no extra services.
- [ ] Tests run against Chromium by default. Firefox can be enabled as a second project but is not required to pass at first.

### Test isolation and determinism
- [ ] Every test creates its own users with unique emails/usernames (worker index + timestamp/uuid). Tests never depend on each other's data.
- [ ] Tests may use the seed users that `InitService` creates on boot (Florian, Alex, Tom, Stella / `password`) only for read-only checks, never for mutations
- [ ] No fixed `waitForTimeout`/sleep calls. Use only web-first assertions (`expect(locator).toBeVisible()` etc.).
- [ ] Throttling must not make the suite flaky: auth (5 req / 15 min), global (100 req / min) and WS connection (10 / min) limits must not be hit by normal tests
- [ ] The suite passes with `--repeat-each=3` and with `fullyParallel` on (≥ 2 workers)

### Selectors
- [ ] Prefer role/label/text locators (`getByRole`, `getByLabel`). Add `data-testid` attributes only where no accessible locator is stable (icon-only buttons, message bubbles, contact list items, read-receipt icons, typing indicator).
- [ ] Tests run with the UI forced to English (localStorage `language=en`), except the i18n test

### Feature coverage (everything except voice/video calls)
- [ ] **Auth**: register (success, password mismatch, invalid email, weak password / min length, email already taken), login (success, wrong password, unknown email), logout, session persists across reload, protected route redirects to login, auth throttling message (UI handling of a mocked 429)
- [ ] **Contacts**: search users, add a contact, filter contact list, remove (delete chat) a contact, contact auto-added on the recipient's side when a message arrives
- [ ] **Contact requests**: recipient sees the accept prompt for a non-accepted contact, accept enables messaging
- [ ] **Messaging (1:1, real-time, two browser contexts)**: send via Enter and via send button, message appears live for the recipient, contact list preview shows the last message, read receipt appears when the recipient opens the chat, typing indicator ("is typing..."), delete messages (empty chat), message history survives reload
- [ ] **Image messages**: upload via file input → "Show Image" → image renders, invalid file type is rejected
- [ ] **Audio messages**: record with a fake microphone → audio message appears for both sides (Chromium only)
- [ ] **Groups**: create group (needs ≥ 2 contacts, hint shown otherwise), send group message received by all members, leave group, left group appears under "Left Groups", left member does not get new messages, rejoin group restores delivery
- [ ] **Ignore users**: ignore via chat menu with confirmation dialog, ignored user listed under "Ignored Users", ignored user's messages are not delivered, un-ignore with confirmation
- [ ] **Profile**: upload an avatar → success snackbar → avatar visible to self (and to a contact after reload)
- [ ] **Online status**: contact shows as online while the other context is connected and offline after it closes. Call buttons are disabled for offline contacts (only assert the disabled state, never start a call).
- [ ] **i18n**: switch language EN ↔ DE through the language modal, choice persists across reload
- [ ] **Responsive**: on a mobile viewport the sidebar/chat toggle and back button work (covers the recent welcome-message mobile fix)

## Must Not Have

### Anti-Requirements
- [ ] Do NOT test voice/video calls (PeerJS/coturn need infra that is out of scope). Asserting the call buttons' enabled/disabled state is fine.
- [ ] Do NOT require Kubernetes, minikube, Helm or a production build
- [ ] Do NOT turn off throttling or auth globally in production code paths. Any test-only switch must be opt-in through an env var that defaults to off.
- [ ] Do NOT change REST or WebSocket contracts to accommodate tests
- [ ] Do NOT put sleeps or retries in test code to hide real race conditions. If a test exposes one, record it as a bug.
- [ ] Do NOT touch the backend Jest e2e setup (`backend/test/`). It stays as is.

## Nice to Have
- [ ] GitHub Actions workflow running the suite on PRs (docker compose services + Playwright, HTML report uploaded as an artifact)
- [ ] Firefox / WebKit projects green
- [ ] Trace on first retry, video on failure
