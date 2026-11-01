# Demo Mode - Requirements

## Context
Recruiters and interviewers should be able to try the live app without a sign-up form. A plain throwaway
account isn't enough: a new user has no contacts, so nothing real-time can be seen. Demo mode gives every
visitor a ready-made guest account with contacts, a group, some chat history and a contact that answers,
plus a way to open a second guest to chat with yourself.

The existing data reset (all collections wiped on every backend start in `InitService`) is intentional to keep
the database clean. It moves to a nightly job, which also empties the S3 bucket. Uploads currently pile up there
because nothing ever deletes them.

## Must Have

### Functional Requirements
- [ ] The login page shows a "Try the demo, no sign-up needed" button when demo mode is enabled
- [ ] One click creates a guest account and signs it in (same cookies as a normal login), then opens the dashboard
- [ ] Guests get a random username `Guest` + 4 digits (fits the 15 character limit) and a random default avatar (`avatar1-4.svg`)
- [ ] A new guest is already a contact of the demo personas (Florian, Stella, Alex, Tom) and they are contacts of the guest
- [ ] A new guest is a member of a demo group with two personas
- [ ] A new guest finds a few existing messages (one direct chat and the group), so the app looks used straight away
- [ ] Stella ("demo bot") answers direct messages from guests: typing indicator, then read receipt, then a reply after 1-3 s
- [ ] In the demo group, a persona sometimes answers a guest's message (same sequence)
- [ ] Guests can invite a second guest: "Chat with yourself" creates a partner guest who is a contact of the first one,
      and shows a one-time link (with a copy button) that signs the partner in, e.g. in a private window or on a phone
- [ ] Guests see a banner in the dashboard: demo account, all data is reset nightly at 00:00 (Europe/Berlin)
- [ ] All data (users, messages, groups, requests, ignores, file access, cache, S3 objects) is reset nightly at 00:00 Europe/Berlin
- [ ] After the reset the demo personas are seeded again
- [ ] Users whose account was deleted by the reset are signed out and see a "the demo was reset" notice on the login page
- [ ] Normal registration and login keep working in demo mode

### Non-Functional Requirements
- [ ] Guest creation is rate limited per IP (`AuthThrottle`: 5 per 15 min) and capped globally per day (`DEMO_MAX_GUESTS_PER_DAY`, default 500); above the cap: 503 with a translated message
- [ ] Partner invites: at most 1 partner per guest
- [ ] Bot replies are capped per guest (`DEMO_MAX_BOT_REPLIES_PER_HOUR`, default 30) so the bot can't be used to amplify load
- [ ] Guest uploads (images, audio, avatar) are capped per guest per day (`DEMO_MAX_UPLOADS_PER_DAY`, default 20); existing file size limits stay
- [ ] Guest creation including seeding responds in < 1 s
- [ ] The reset runs exactly once per night, whatever the backend replica count
- [ ] The reset is idempotent and safe to run by hand (`npm run demo:reset` locally)
- [ ] All new UI strings are translated (en + de)
- [ ] All existing unit and e2e tests pass

### Security / Privacy Requirements
- [ ] **Guest isolation:** guests never see other guests (except their own partner) in `GET /users`, `POST /users/search` or contact requests; non-guests don't see guests either
- [ ] Guests can only add personas and their partner as contacts
- [ ] **Personas are not loginable in demo mode:** they get a random password at seed time (today all seed accounts use `password`, so anyone could log in as Stella and read every visitor's conversation with her)
- [ ] Guest emails use the reserved `.invalid` TLD (`guest-<random>@demo.invalid`); guests never get a password they could reuse elsewhere
- [ ] Partner invite tokens are random (≥ 128 bit), single use, expire after 15 minutes, and are stored only in Redis
- [ ] Demo endpoints return 404 when demo mode is off

### Technical Requirements
- [ ] `DEMO_MODE=true|false` backend env var (default `false`), set in the Helm values for production
- [ ] The frontend learns about demo mode at runtime (`GET /demo/status`), so one image works with and without it
- [ ] `isGuest: boolean` (default `false`) and `guestPartnerId?: string` on `UserEntity`
- [ ] New `DemoModule` with `DemoController`, `DemoGuestService`, `DemoBotService`, `DemoResetService`, `DemoSeedService`
- [ ] Seeding (personas) moves from `InitService` into `DemoSeedService`, is idempotent and runs on boot only if the database has no users
- [ ] **The wipe on boot is removed**; the reset runs as a standalone Nest application context (`dist/src/demo-reset.js`) from a Kubernetes CronJob
- [ ] `ObjectStorageService.deleteAllObjects()`: `ListObjectsV2` + one `DeleteObject` per key (GCS's S3-compatible API does not support the multi-object `DeleteObjects`)
- [ ] The bot reacts to the in-process `MESSAGE_SENT` event; typing goes out over the socket like a user's typing event, read uses the same path as a user reading the message (`MESSAGE_READ` event)
- [ ] Sign-in cookies are set by one shared helper used by `AuthController.signIn` and the demo endpoints (no third copy of the cookie options)
- [ ] Before the reset, a `demoReset` socket message goes to all connected clients so they sign out cleanly

### Data Model Requirements
- [ ] `users.isGuest` (default `false`), `users.guestPartnerId?` (no migration needed, data is reset nightly anyway)
- [ ] Redis keys: `demo:guests:<yyyy-mm-dd>` (counter, 48 h TTL), `demo:invite:<token>` (15 min TTL), `demo:bot-replies:<guestId>` (1 h TTL), `demo:uploads:<guestId>:<yyyy-mm-dd>` (48 h TTL)

## Must Not Have

### Anti-Requirements
- [ ] Do NOT publish shared demo credentials
- [ ] Do NOT let guests or anyone else log in as a persona
- [ ] Do NOT let guests discover or message other visitors
- [ ] Do NOT wipe data on backend start anymore (dangerous with several replicas, and it happens on every deploy)
- [ ] Do NOT change existing REST routes or socket payloads (only additive changes and filtering)
- [ ] Do NOT enable demo mode in the e2e suite by default (dedicated demo e2e tests enable it explicitly)
- [ ] Do NOT use an LLM or external service for the bot; canned replies are enough

## Constraints
- Zod 3 / NestJS 11 / ts-rest stay as they are (see deferred upgrade decision)
- Must work with several backend replicas and the Redis Socket.IO adapter
- The GKE release channel must support `CronJob.spec.timeZone` (stable since Kubernetes 1.27)
- No new npm dependencies (a CronJob instead of `@nestjs/schedule`); if one becomes necessary, vet it first (CLAUDE.md)

## Dependencies
- Existing: `EventBusService`, `SocketGateway`, `ObjectStorageService`, `AuthService`, `UserService`, `ContactService.addContactIfNotExists`,
  `ContactGroupService`, `@AuthThrottle()`, Redis cache, typesafe-i18n, Helm chart `helm/realtime-chat`, Terraform `k8s` root
- AWS SDK `@aws-sdk/client-s3` (already installed) for `ListObjectsV2` / `DeleteObject`

## Open Decisions
- Bot persona: Stella (as written) or a separate "Demo Bot" account
- Reset time and time zone: 00:00 Europe/Berlin (as written)
- Default limits above: 500 guests/day, 30 bot replies/hour, 20 uploads/day
- QR code for the partner link (needs a dependency, so not in the first version)
