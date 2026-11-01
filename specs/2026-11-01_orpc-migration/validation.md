# oRPC Migration & Typed Socket Contract - Validation

## Validation Strategy

### 1. Unit Test Validation

```bash
cd backend && npm run test
cd frontend && npm run build   # tsc type-check
```

#### Phase 0: Socket Auth
- [ ] Valid token for user A + `query.userId=B` → socket is in room A, not B; presence is set for A
- [ ] Missing/invalid token → disconnected, no room joined
- [ ] `typing` from A with `payload.userId=B` → recipients receive `userId: A`

#### Phase 2: Services
- [ ] `MessageService`, `UserService`, `OnlineStatusService`, `ContactService`, `ContactGroupService` return plain
      values; the former non-2xx paths throw the matching `ClientFriendlyHttpException`
- [ ] Existing `message.service.spec.ts` / `user.service.spec.ts` updated and passing

#### Phase 3-4: HTTP Layer
- [ ] oRPC input validation error → 400 with `errorCode: EXT_VALIDATION_001` and the failing fields
- [ ] A `ClientFriendlyHttpException` thrown in a handler → same status and body as before
- [ ] An unknown error → 500 `OperationFailedException` body, reported to Sentry
- [ ] Throttled route → 429 with `Retry-After: 60`
- [ ] Upload above `MAX_FILE_SIZE_BYTES` → 413 `FileTooLargeException` body

#### Phase 7: Socket Contract
- [ ] `typing` with an invalid payload (missing `contactId`, non-boolean `isTyping`) → no broadcast, `error`
      event with `EXT_VALIDATION_001`
- [ ] Both throttle paths emit an `error` payload that matches the shared schema
- [ ] Type-level: emitting an unknown event or a wrong payload in the gateway or the frontend fails `tsc`
      (one `// @ts-expect-error` test per side)

#### Existing Tests
- [ ] All existing backend unit tests pass after every phase

### 2. Wire Compatibility Validation
Before Phase 3, record the current responses; after each Phase 4 group, compare.

```bash
# backend running locally, signed-in cookie jar in $JAR
curl -si -b $JAR -X POST localhost:3000/get-messages -H 'content-type: application/json' -d '{"contactId":"…"}'
```

- [ ] For every route: same status code, same `content-type`, same JSON body (ignoring ids/dates), same cookies
      on `signIn`/`refresh`/`signUp`/`signOut`
- [ ] Invalid body on a sample route per contract → 400 with the same shape as before
- [ ] `backend/openapi.json` contains exactly the routes in the inventory (count = procedures in all contracts),
      with the same paths and methods as today
- [ ] `loadFile` returns binary with the correct content type (the only intended change)

### 3. E2E Validation

```bash
npm run e2e:infra
npm run e2e
```

- [ ] Full suite passes after Phase 0, after Phase 2, after each Phase 4 group, after Phase 6 and after Phase 7
- [ ] Specifically covered by existing tests: sign-up/sign-in/refresh/sign-out, sending text/image/audio,
      read receipts, typing indicator, online/offline, contact requests, groups, ignore/unignore, avatar upload
- [ ] New `e2e/tests/security/socket-room.spec.ts`: user A connects with `query.userId` of user B and does not
      receive B's messages (Phase 0)
- [ ] Manual: an expired access token during a chat → silent refresh, request retried, no snackbar

### 4. Dependency & Cleanup Validation
- [ ] Every `@orpc/*` package and version was checked for compromise reports before install; versions pinned
- [ ] `npm ls zod` shows a single 3.x version ≥ 3.24 in backend and frontend
- [ ] After Phase 6: `grep -rn "ts-rest" backend frontend --exclude-dir=node_modules` returns nothing;
      `npm ls @ts-rest/core` is empty
- [ ] `npm audit` shows no new findings compared to `main`
