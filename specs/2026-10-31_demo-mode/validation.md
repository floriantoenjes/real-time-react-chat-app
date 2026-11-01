# Demo Mode - Validation

## Validation Strategy

### 1. Unit Test Validation

```bash
cd backend && npm run test
```

#### ObjectStorageService
- [ ] `deleteAllObjects()` pages through `ListObjectsV2` until `IsTruncated` is false
- [ ] `deleteAllObjects()` calls `DeleteObject` once per key and never `DeleteObjects`
- [ ] An empty bucket deletes nothing and returns 0

#### DemoResetService / DemoSeedService
- [ ] `reset()` empties every collection, clears the cache, empties the bucket, then seeds
- [ ] `seed()` does nothing if a user exists (idempotent)
- [ ] With `DEMO_MODE=true` persona passwords are random (a sign-in with `password` fails)
- [ ] With `DEMO_MODE=false` personas keep the local development password

#### DemoGuestService
- [ ] `createGuest()` creates a user with `isGuest: true`, a `Guest` + 4 digit username and an `avatar1-4.svg` avatar
- [ ] The guest and each persona are contacts of each other
- [ ] The guest is a member of the demo group; the direct chat and the group have the seeded messages
- [ ] Above `DEMO_MAX_GUESTS_PER_DAY` → `DemoCapacityReachedException`
- [ ] A username collision is retried
- [ ] `createPartner()` works once per guest; a second call is rejected
- [ ] An invite token works once and expires after 15 minutes

#### DemoBotService
- [ ] A guest's direct message to Stella → typing, read, reply in that order (fake timers)
- [ ] Messages from non-guests and to non-bot users are ignored
- [ ] Group message → a persona answers with the configured probability (seeded random)
- [ ] Above the reply cap → no reply
- [ ] Image and audio messages get a matching reply

#### Guest Isolation
- [ ] `GET /users` / user search for a guest: personas and own partner, no other guests
- [ ] `GET /users` for a non-guest: no guests
- [ ] A guest adding a non-persona, non-partner contact → 403
- [ ] Upload cap → 429 after `DEMO_MAX_UPLOADS_PER_DAY`

#### Existing Tests
- [ ] All existing backend unit tests pass

### 2. E2E Validation

```bash
npm run e2e:infra
npm run e2e                 # existing suite, demo mode off
npm run e2e -- --project=demo
```

#### New: `e2e/tests/demo/guest.spec.ts`
- [ ] "Try the demo" → dashboard with the personas, the demo group and seeded messages
- [ ] Message to Stella → typing indicator, read receipt, reply
- [ ] Banner with the reset notice is visible
- [ ] Two independent guests can't find each other in the contact search

#### New: `e2e/tests/demo/partner.spec.ts`
- [ ] "Chat with yourself" → invite link; opening it in a second context signs in the partner
- [ ] Both guests see each other as contacts and chat in real time
- [ ] The link doesn't work a second time

#### New: `e2e/tests/demo/reset.spec.ts`
- [ ] Running the reset while a guest is signed in → the guest lands on the login page with the "demo was reset" notice
- [ ] After the reset the personas exist again and a new guest can be created

#### Demo mode off
- [ ] Without `DEMO_MODE` the button isn't shown and `/demo/*` returns 404

#### Existing Tests
- [ ] Full e2e suite passes (no wipe on boot anymore: tests must not rely on an empty database, they already create unique users)

### 3. Infrastructure Validation
- [ ] `helm template` renders the CronJob only with `demo.reset.enabled=true`, with `timeZone: Europe/Berlin` and `concurrencyPolicy: Forbid`
- [ ] `terraform plan` in `terraform/k8s` only changes the Helm release values
- [ ] After deploying: `kubectl create job --from=cronjob/<name> demo-reset-manual` succeeds, the logs show deleted counts, the bucket is empty afterwards (`gcloud storage ls`)
- [ ] The next morning: the CronJob ran once at 00:00 Europe/Berlin (`kubectl get jobs`)
- [ ] With `replicaCount: 2`, restarting one pod deletes no data

### 4. Manual Validation
- [ ] Demo on a phone (mobile layout, invite link opened on a second device)
- [ ] Video call between the two guests works through TURN
- [ ] German texts after switching the language
- [ ] A seeded persona can't be signed in with `password` in production
- [ ] After several hours of use, the bot reply cap and upload cap show sensible messages
