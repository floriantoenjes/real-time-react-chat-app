# Demo Mode - Plan

## Overview
Add a demo mode that gives every visitor a ready-made guest account with one click, and replace the reset on
every backend start with a nightly reset that also empties the S3 bucket.

Today `InitService.onApplicationBootstrap()` wipes every collection and seeds four users (Florian, Alex, Tom,
Stella, all with the password `password`) on every start. That runs on every deploy and on every pod start; with
`replicaCount > 1` a newly started pod deletes data under the feet of active users. S3 objects (avatars, images,
audio) are never deleted.

## Phases

### Phase 1: Nightly Reset Instead of Reset on Boot (Est: 3-4 hours)
- [ ] Add `ObjectStorageService.deleteAllObjects()`: page through `ListObjectsV2` (`ContinuationToken`) and call `DeleteObject` per key; return the count
- [ ] Create `DemoResetService.reset()`: the wipe from `InitService` (all collections + `cache.clear()`) plus `deleteAllObjects()`, then `DemoSeedService.seed()`; log counts
- [ ] Create `DemoSeedService.seed()`: the personas from `InitService`, idempotent (returns if any user exists). With `DEMO_MODE=true` personas get a random password (`randomBytes(32)`), otherwise `password` as today, for local development
- [ ] Replace `InitService` with a boot hook that only calls `DemoSeedService.seed()` (no wipe)
- [ ] Add `src/demo-reset.ts`: `NestFactory.createApplicationContext(AppModule)` → emit `demoReset` (see Phase 5) → `reset()` → `close()`; exit code 1 on error
- [ ] `backend/package.json`: `"demo:reset": "node dist/src/demo-reset"`
- [ ] Helm: `templates/demo-reset-cronjob.yaml`, enabled by `demo.reset.enabled`; `schedule: "0 0 * * *"`, `timeZone: Europe/Berlin`,
      `concurrencyPolicy: Forbid`, same image, env and secret as the deployment, `command: ["node", "dist/src/demo-reset"]`, `backoffLimit: 1`
- [ ] Terraform `k8s`: pass `demo.reset.enabled=true` in the Helm release
- [ ] Optional safety net: GCS lifecycle rule on the uploads bucket deleting objects older than 2 days (`terraform/infra`)

**Files:**
- `backend/src/modules/global/object-storage.service.ts`
- `backend/src/modules/demo/demo-reset.service.ts` (new)
- `backend/src/modules/demo/demo-seed.service.ts` (new, content moved from `init.service.ts`)
- `backend/src/modules/init/*` (removed, or reduced to the seed call)
- `backend/src/demo-reset.ts` (new)
- `backend/package.json`
- `helm/realtime-chat/templates/demo-reset-cronjob.yaml` (new), `helm/realtime-chat/values.yaml`
- `terraform/k8s/*.tf` (Helm release values), optionally `terraform/infra/*.tf` (lifecycle rule)

### Phase 2: Guest Accounts (Est: 3-4 hours)
- [ ] `UserEntity`: `@Prop({ default: false }) isGuest`, `@Prop() guestPartnerId?`
- [ ] Config: `DEMO_MODE`, `DEMO_MAX_GUESTS_PER_DAY` (500) via `ConfigService`; add to `.example.env` and Helm values
- [ ] New `demoContract` (`backend/shared/demo.contract.ts`):
  - `GET /demo/status` → `{ enabled: boolean }` (public)
  - `POST /demo/guest` → same body as `signIn` (public, `@AuthThrottle()`)
- [ ] Extract `setAuthCookies(res, tokens)` from `AuthController` into a shared helper and use it in `signIn`, `refresh`, `signUp` and the demo controller
- [ ] `DemoGuestService.createGuest()`:
  1. Increment `demo:guests:<date>` in Redis; above the cap → `DemoCapacityReachedException` (503)
  2. `AuthService.createAuthUser(guest-<uuid>@demo.invalid, randomBytes(32), Guest<4 digits>)` (retry on username collision)
  3. Set `isGuest`, random `avatarFileName` (`avatar1-4.svg`)
  4. `addContactIfNotExists` in both directions for each persona
  5. Create the demo group (guest + Florian + Stella)
  6. Seed history: 2 messages from Stella in the direct chat, 2 messages in the group (written directly, without socket events)
  7. Sign in → tokens
- [ ] `DemoController` returns 404 for all routes when `DEMO_MODE` is off (guard or check)

**Files:**
- `backend/shared/demo.contract.ts` (new), `backend/shared/user.contract.ts` (`isGuest` optional in `UserSchema`)
- `backend/src/modules/user/user.schema.ts`
- `backend/src/modules/auth/auth.controller.ts`, `backend/src/modules/auth/auth-cookies.ts` (new)
- `backend/src/modules/demo/demo.module.ts`, `demo.controller.ts`, `demo-guest.service.ts` (new)
- `backend/src/errors/external/demo-capacity-reached.exception.ts` (new)
- `backend/src/app.module.ts`, `backend/.example.env`

### Phase 3: Guest Isolation & Limits (Est: 2-3 hours)
- [ ] `UserService.findUsersBy()` / `GET /users` / `POST /users/search`: for everyone, exclude guests other than the caller's partner
      (`{ $or: [{ isGuest: false }, { _id: partnerId }] }`); cache key has to include the caller then (check `findUsersByCacheKey`)
- [ ] `ContactService.addContact` and contact requests: a guest may only add personas and their partner; others → 403
- [ ] Upload cap for guests (`demo:uploads:<guestId>:<date>`) in `MessageService.uploadFileAsMessage` and `UserService.updateUserAvatar`; above → 429
- [ ] Check every place that lists users: contact requests, group creation (member picker), online status

**Files:**
- `backend/src/modules/user/user.service.ts`, `user.controller.ts`
- `backend/src/modules/relationships/contact/contact.service.ts`
- `backend/src/modules/relationships/contact-request/*`
- `backend/src/modules/message/message.service.ts`
- `backend/src/cache/cache-keys.ts`

### Phase 4: Demo Bot & Partner Guest (Est: 3-4 hours)
- [ ] `DemoBotService` listens on `MESSAGE_SENT` (pattern of `ContactService.listenOnEvents`):
  - Direct message from a guest to Stella → after 600 ms emit `typing` (isTyping true) from Stella to the guest,
    mark the message read (extract a `MessageService.markMessageRead(messageId, readerId)` that emits `MESSAGE_READ`),
    after 1-3 s send a reply through `MessageService` (so the guest gets the normal `message` event), then typing false
  - Message from a guest to the demo group → with 50 % probability one persona answers (same sequence)
  - Canned replies: a list per persona, picked by simple keywords (hello, image, audio, call, otherwise random); image/audio messages get a matching answer
  - Skip when the reply cap (`demo:bot-replies:<guestId>`) is reached
  - Timers live in the replica that handled the message; nothing to coordinate
- [ ] Partner guest:
  - `POST /demo/partner` (guest only, once per guest) → creates a guest with `guestPartnerId` set on both, adds both as contacts, stores `demo:invite:<token>` → returns `{ inviteUrl }`
  - `POST /demo/join` `{ token }` (public, throttled) → reads and deletes the token (`GETDEL`), signs in the partner, sets cookies
- [ ] Video/voice calls between guests: check that PeerJS/TURN work for guests without changes

**Files:**
- `backend/src/modules/demo/demo-bot.service.ts`, `demo-replies.ts` (new)
- `backend/src/modules/message/message.service.ts` (`markMessageRead`)
- `backend/src/modules/socket-gateway/socket.gateway.ts` (server-side typing emit helper)
- `backend/src/modules/demo/demo.controller.ts`, `demo-guest.service.ts`
- `backend/shared/demo.contract.ts`

### Phase 5: Frontend (Est: 3-4 hours)
- [ ] `DemoService` (`GET /demo/status`, `POST /demo/guest`, `POST /demo/partner`, `POST /demo/join`)
- [ ] `Login.tsx`: "Try the demo, no sign-up needed" button above the form, only if enabled; on success the same flow as a successful login
- [ ] Route `/demo/join?token=…`: exchanges the token, then opens the dashboard; error page for invalid or used tokens
- [ ] Dashboard banner for `user.isGuest`: reset notice + "Chat with yourself" button → dialog with the invite link and a copy button
- [ ] Socket `demoReset` and 401 after a reset → sign out, login page with the notice "The demo was reset"
- [ ] i18n (en + de): `TRY_DEMO`, `TRY_DEMO_HINT`, `DEMO_BANNER`, `CHAT_WITH_YOURSELF`, `INVITE_LINK_COPIED`, `DEMO_WAS_RESET`, `ERROR.DEMO_CAPACITY_REACHED`, `ERROR.INVITE_INVALID`

**Files:**
- `frontend/src/shared/services/DemoService.ts` (new)
- `frontend/src/login/Login.tsx`
- `frontend/src/demo/DemoJoin.tsx` (new), router in `frontend/src/index.tsx`
- `frontend/src/dashboard/Dashboard.tsx`, `frontend/src/dashboard/demo/DemoBanner.tsx` (new)
- `frontend/src/shared/contexts/*` (socket `demoReset` handling)
- `frontend/src/i18n/{en,de}/index.ts`, generated `i18n-types.ts`
- `backend/shared/socket-message-types.enum.ts` (`demoReset`)

### Phase 6: Testing, Docs & Rollout (Est: 3-4 hours)
- [ ] Backend unit tests (see validation.md)
- [ ] E2E: separate Playwright project `demo` that starts the backend with `DEMO_MODE=true` (own `webServer` entry on another port or env switch); specs in `e2e/tests/demo/`
- [ ] README: "Try it live" link near the top, short "Demo mode" section (guest isolation, limits, nightly reset)
- [ ] ADR in `docs/adr/`: demo mode design (guest accounts vs shared credentials, nightly CronJob vs reset on boot, abuse limits)
- [ ] Deploy with `LETSENCRYPT_ENVIRONMENT` unchanged; trigger the CronJob once by hand (`kubectl create job --from=cronjob/...`) and check the logs

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/shared/demo.contract.ts` | CREATE | Demo routes |
| `backend/shared/user.contract.ts` | MODIFY | Optional `isGuest` |
| `backend/shared/socket-message-types.enum.ts` | MODIFY | `demoReset` |
| `backend/src/modules/demo/*` | CREATE | Module, controller, guest/bot/reset/seed services, replies |
| `backend/src/modules/init/*` | DELETE | Replaced by `DemoSeedService` (seed only, no wipe) |
| `backend/src/demo-reset.ts` | CREATE | CronJob entry point |
| `backend/src/modules/global/object-storage.service.ts` | MODIFY | `deleteAllObjects()` |
| `backend/src/modules/auth/auth.controller.ts`, `auth-cookies.ts` | MODIFY/CREATE | Shared cookie helper |
| `backend/src/modules/user/user.schema.ts`, `user.service.ts`, `user.controller.ts` | MODIFY | `isGuest`, guest filtering, upload cap |
| `backend/src/modules/relationships/contact/contact.service.ts`, `contact-request/*` | MODIFY | Guest restrictions |
| `backend/src/modules/message/message.service.ts` | MODIFY | `markMessageRead`, upload cap |
| `backend/src/modules/socket-gateway/socket.gateway.ts` | MODIFY | Server-side typing, `demoReset` broadcast |
| `backend/src/app.module.ts`, `backend/.example.env`, `backend/package.json` | MODIFY | Module, env, script |
| `helm/realtime-chat/templates/demo-reset-cronjob.yaml`, `values.yaml` | CREATE/MODIFY | Nightly reset, `DEMO_MODE` |
| `terraform/k8s/*.tf` | MODIFY | Enable demo mode and CronJob |
| `frontend/src/login/Login.tsx`, `frontend/src/demo/*`, `frontend/src/dashboard/demo/*` | MODIFY/CREATE | Button, join page, banner |
| `frontend/src/shared/services/DemoService.ts` | CREATE | API client |
| `frontend/src/i18n/{en,de}/index.ts` | MODIFY | New strings |
| `e2e/tests/demo/*`, `playwright.config.ts` | CREATE/MODIFY | Demo e2e project |
| `README.md`, `docs/adr/000x-demo-mode.md` | MODIFY/CREATE | Docs |

## Risk Assessment

### Low Risk
- `GET /demo/status`, login button, banner, i18n
- Seeding moved into its own service

### Medium Risk
- Filtering users by `isGuest` touches a cached query (`findUsersBy`); a wrong cache key would leak users across callers
- Bot timers on a replica that shuts down mid-reply: the reply is lost, which is acceptable
- Removing the wipe on boot: local and e2e databases are no longer cleaned on start (run `npm run demo:reset` or recreate the Docker volume)
- CronJob needs the same env/secret wiring as the deployment; a mismatch only shows at midnight (trigger it once by hand after deploying)

### High Risk
- Guest isolation: any endpoint that lists users and is missed leaks visitors to each other (listing in Phase 3, e2e tests in validation.md)
- Persona passwords: if `DEMO_MODE` isn't set in production, the personas keep `password`

### Mitigation
- One query helper for "users visible to the caller", used by every listing endpoint
- E2E test that two independent guests can't find each other
- Startup warning log if `NODE_ENV=production` and personas would get the default password

## Rollback Strategy
- `DEMO_MODE=false` hides the button and disables every demo route without a deploy of new code
- Disabling the CronJob (`demo.reset.enabled=false`) stops the nightly reset; data then accumulates like before the change
- `isGuest` / `guestPartnerId` are additive fields and harmless after a rollback
