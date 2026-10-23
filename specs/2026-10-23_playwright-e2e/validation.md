# Playwright E2E Tests - Validation

## Validation Strategy

### 1. Migration Validation
```bash
# No Cypress traces left
git grep -i cypress -- ':!specs' ':!package-lock.json'   # → no results
npm ls cypress                                            # → (empty)
```
- [ ] `cypress/` and `cypress.config.ts` deleted
- [ ] `package-lock.json` updated (no cypress, has @playwright/test)
- [ ] `.gitignore` covers `test-results/`, `playwright-report/`, `blob-report/`, `e2e/.auth/`

### 2. Local Run
```bash
npm run e2e:infra        # docker compose up -d (mongo rs0, redis, s3mock)
npm run e2e              # starts backend + frontend via webServer, runs suite
npm run e2e:report       # open HTML report
```
- [ ] Suite is green on a fresh checkout with only docker + node installed (plus `backend/.env` from `.example.env`)
- [ ] Suite is green when backend/frontend are already running (`reuseExistingServer`)
- [ ] With infra down, globalSetup fails within a few seconds and gives a clear message

### 3. Stability
```bash
npx playwright test --repeat-each=3 --workers=4
npx playwright test --grep-invert @chromium-only --project=firefox   # optional
```
- [ ] 0 failures over 3 repetitions
- [ ] `grep -rn "waitForTimeout" e2e/` → no results
- [ ] No test depends on execution order

### 4. Throttling Isolation
- [ ] The full suite never returns "Too many requests" outside `throttle.spec.ts`
- [ ] `throttle.spec.ts` shows the rate-limit message for a (mocked) 429
- [x] With `E2E_THROTTLE_MULTIPLIER` unset or invalid the backend uses the original limits (`throttle-multiplier.config.spec.ts`)

### 5. Coverage Checklist
Every requirement in `requirements.md` → "Feature coverage" maps to at least one test:

| Area | Spec file | Status |
|---|---|---|
| Register / login / logout / session | `auth/*.spec.ts` | ☐ |
| Auth throttling | `auth/throttle.spec.ts` | ☐ |
| Contact search / add / filter / delete | `contacts/contacts.spec.ts` | ☐ |
| Contact request accept | `contacts/contact-request.spec.ts` | ☐ |
| 1:1 messaging live + history + delete | `messaging/direct-messages.spec.ts` | ☐ |
| Read receipts + typing indicator | `messaging/read-receipts-typing.spec.ts` | ☐ |
| Image + audio messages | `messaging/media.spec.ts` | ☐ |
| Group create + messaging | `groups/groups.spec.ts` | ☐ |
| Leave / left list / rejoin | `groups/left-groups.spec.ts` | ☐ |
| Ignore / un-ignore | `relationships/ignore.spec.ts` | ☐ |
| Avatar upload | `profile/avatar.spec.ts` | ☐ |
| Online status + call button state | `presence/online-status.spec.ts` | ☐ |
| Language switch + persistence | `i18n/language.spec.ts` | ☐ |
| Mobile layout | `responsive/mobile.spec.ts` | ☐ |

### 6. Non-Regression
```bash
cd backend && npm test          # unit tests still green
cd frontend && npm run lint     # selector/i18n additions lint-clean
cd frontend && npm run build    # typesafe-i18n types regenerated, build passes
```
- [ ] Added `aria-label`s / `data-testid`s cause no visual changes (manual check in desktop + mobile view)
- [ ] No REST/WS contract changes (`git diff main -- backend/shared` contains only additive i18n-unrelated changes, ideally none)

### 7. Bugs Found
List any application bugs that tests uncovered (each has a `test.fixme` referencing it):
- _none yet_

## Success Criteria
1. Cypress is gone and `npm run e2e` runs a green Playwright suite locally
2. All features except voice/video calls are covered per the table above
3. The suite is stable across repetitions and parallel workers
4. Production throttling/auth behaviour is unchanged
