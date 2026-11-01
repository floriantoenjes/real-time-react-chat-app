# oRPC Migration & Typed Socket Contract - Plan

## Overview
Replace ts-rest with oRPC in OpenAPI mode, one contract at a time, so that every route, payload and error shape
stays the same. Add a typed, Zod-validated Socket.IO contract. Before that, fix the socket authentication issue
(room joined from client-supplied `userId`) in its own PR.

Order: Phase 0 (security fix) → Phase 1 (spike + decision gate) → Phase 2 (services decoupled from ts-rest) →
Phases 3-5 (migration, side by side) → Phase 6 (cleanup) → Phase 7 (socket contract; can run in parallel with
3-5 once Phase 0 is merged).

## Phases

### Phase 0: Socket Auth Fix, separate PR (Est: 1-2 hours)
- [ ] `canSocketBeAuthenticated` returns the verified `JwtPayload` (or `null`) instead of `boolean`
- [ ] `handleConnection`: store `payload.sub` in `socket.data.userId`; join that room; use it for presence
- [ ] `handleDisconnect`, `pong`, `handleTyping`: read `socket.data.userId`; never `handshake.query.userId`
- [ ] `handleTyping`: emit `{ userId: socket.data.userId, isTyping }`, ignore `payload.userId`
- [ ] Frontend `SocketContext`: stop sending `query.userId` (backend ignores it anyway, so this can ship later)
- [ ] Unit test for the gateway: a socket with a valid token for user A and `query.userId=B` joins room A only

**Files:**
- `backend/src/modules/socket-gateway/socket.gateway.ts`
- `backend/src/modules/socket-gateway/socket.gateway.spec.ts` (new)
- `frontend/src/shared/contexts/SocketContext.tsx`

### Phase 1: Spike & Decision Gate (Est: 4-6 hours)
- [ ] Decide on the major version: check whether `@orpc/*` 2.0 is GA. If yes, use 2.x; if not, use the stable 1.x
      `latest` line and record the version in the memory file
- [ ] Vet every package and the exact version (Socket, npm advisories, GitHub issues, recent supply-chain
      reports) per `CLAUDE.md`; pin exact versions
- [ ] Bump `zod` to the newest 3.x (≥ 3.24, Standard Schema) in backend and frontend; run all tests
- [ ] Prototype on a branch with **`loggingContract`** (simple) and **`fileContract`** (multipart + binary), end to end
      through Nest and the frontend. Answer and write down in this plan:
  - [ ] How `@orpc/nest` interacts with Nest's body parser and Multer (does `FileInterceptor` stay, or does oRPC
        parse multipart itself?), and how the 10 MB limit (`MAX_FILE_SIZE_BYTES` → 413) is enforced
  - [ ] Do Nest guards (auth), `@StrictThrottle`/`@AuthThrottle` and `@UserId()` work on `@Implement` methods?
  - [ ] Where thrown `ClientFriendlyHttpException`s end up: does `GlobalExceptionFilter` still get them, or does
        oRPC turn them into its own 500? Find the config (oRPC `onError`/interceptors, or rethrowing as Nest
        exceptions) that keeps today's `{ errorCode, … }` body and status
  - [ ] How oRPC reports input validation errors, and how to map them to `EXT_VALIDATION_001` with field details
  - [ ] How `AuthController` sets cookies (Nest `@Res({ passthrough: true })` vs oRPC response headers)
  - [ ] That `successStatus` (201/204) and response bodies match ts-rest byte for byte (`curl -i` before/after)
  - [ ] Client: `OpenAPILink` with a custom `fetch` for the 401 → refresh → retry flow and the error snackbar
- [ ] Go/no-go: if guards, the error shape or multipart can't be kept without hacks, stop and reconsider
      (fallback: plain Nest + `nestjs-zod` + generated OpenAPI client)

**Files:**
- `backend/package.json`, `frontend/package.json`, `package-lock.json`
- `backend/shared/logging.contract.ts`, `backend/shared/file.contract.ts`
- `backend/src/controllers/logging.controller.ts`, `backend/src/modules/file/file.controller.ts`
- `frontend/src/shared/services/ClientService.ts`, `LoggingService.ts`, `FileService.ts`

### Phase 2: Services Return Plain Values, ts-rest still in place (Est: 3-4 hours)
- [ ] `MessageService`, `UserService`, `OnlineStatusService`, `ContactService`, `ContactGroupService`: return the
      domain value; replace non-2xx returns (e.g. `UserService` 404) with the matching
      `ClientFriendlyHttpException` (add one if missing)
- [ ] Controllers wrap the value in `{ status, body }` for ts-rest for now
- [ ] Update `message.service.spec.ts` and `user.service.spec.ts`
- [ ] Ship on its own: no behaviour change, makes every later controller change a one-liner

**Files:**
- `backend/src/modules/message/message.service.ts`, `message.service.spec.ts`, `message.controller.ts`
- `backend/src/modules/user/user.service.ts`, `user.service.spec.ts`, `user.controller.ts`
- `backend/src/modules/online-status/online-status.service.ts`, `online-status.controller.ts`
- `backend/src/modules/relationships/contact/contact.service.ts`, `contact.controller.ts`
- `backend/src/modules/relationships/contact-group/contact-group.service.ts`, `contact-group.controller.ts`
- `backend/src/errors/external/*` (new exceptions if needed)

### Phase 3: Shared Infrastructure (Est: 3-4 hours)
- [ ] `backend/shared/orpc.ts`: the shared `oc` builder and helpers (e.g. `route(method, path, status)`)
- [ ] Nest setup from the spike: `ORPCModule` registration, error mapping (oRPC validation error →
      `InvalidRequestException`, `ClientFriendlyHttpException` passes through unchanged), body parser / multipart
- [ ] `InvalidRequestException` accepts both the ts-rest and the oRPC validation error until Phase 6
- [ ] Frontend `ClientService`: add `getOrpcClient(contract)` next to `getClient` (both use the same refresh and
      error handling helpers); keep the per-contract client cache and `clearBearerTokenAndClients()`
- [ ] OpenAPI generation: `OpenAPIGenerator` with the Zod 3 converter; `GET /openapi.json` (public) and an
      `npm run openapi` script that writes `backend/openapi.json`

**Files:**
- `backend/shared/orpc.ts` (new)
- `backend/src/app.module.ts`, `backend/src/main.ts`
- `backend/src/errors/filters/global-exception.filter.ts`, `backend/src/errors/external/invalid-request.exception.ts`
- `backend/src/controllers/openapi.controller.ts` (new), `backend/package.json`
- `frontend/src/shared/services/ClientService.ts`

### Phase 4: Migrate Contracts, one PR per group (Est: 6-10 hours)
For each contract: convert the contract (`c.router` → object of `oc.route(...).input(...).output(...)`), switch
the controller to `@Implement`, switch the frontend service to the oRPC client and replace `res.status` checks
with the returned value / `try`/`catch`, then run unit + e2e.

- [ ] Group A (small): `logging`, `coturn`, `online-status`
- [ ] Group B: `file` (binary `loadFile`, change `FileService` to read a `Blob`), `message` (incl. `sendFile`
      multipart)
- [ ] Group C: `auth` (cookies, `@AuthThrottle`, refresh/logout must stay plain routes the client calls directly)
- [ ] Group D: `user`, `contact`, `contact-request`, `contact-group`, `ignored-user`
- [ ] After each group: diff `backend/openapi.json` against the previous one; only the migrated routes may appear

**Files:**
- `backend/shared/*.contract.ts`
- the matching `*.controller.ts` under `backend/src/modules/**` and `backend/src/controllers/`
- the matching `frontend/src/shared/services/*Service.ts`

### Phase 5: Frontend Cleanup (Est: 1-2 hours)
- [ ] Remove `getClient` / the `RecursiveProxyObj`/`AppRouter` types from `ClientService`; rename `getOrpcClient`
      → `getClient`
- [ ] Remove remaining `as any` casts in services; types come from the contract

**Files:**
- `frontend/src/shared/services/*.ts`

### Phase 6: Remove ts-rest (Est: 1 hour)
- [ ] Remove `@ts-rest/core` and `@ts-rest/nest` from both `package.json`s; `npm install`
- [ ] `InvalidRequestException` and `GlobalExceptionFilter`: drop the `RequestValidationError` branch
- [ ] `grep -r ts-rest` returns nothing outside `node_modules` and old specs
- [ ] Update memory: the Zod 4 / NestJS 12 upgrade is now unblocked (separate spec)

**Files:**
- `backend/package.json`, `frontend/package.json`, `package-lock.json`
- `backend/src/errors/**`

### Phase 7: Typed Socket Contract (Est: 3-4 hours, after Phase 0)
- [ ] `backend/shared/socket.contract.ts`:
  - Zod schemas per event: `message` (`MessageSchema`), `messageRead` (id), `typing` (in:
    `{ contactId, isTyping }`, out: `{ userId, isTyping }`), `contactOnline`/`contactOffline` (id),
    `contactAutoAdded` (contact), `contactGroupAutoAdded` (group), `contactProfileUpdated`
    (`UserProfileUpdatedEvent` shape), `userIgnored`/`userUnignored` (id), `ping`/`pong` (none),
    `error` (one schema, `{ errorCode, message?, messageType?, retryAfterMs? }`)
  - `ServerToClientEvents` and `ClientToServerEvents` interfaces built from `z.infer` of those schemas, keyed by
    `SocketMessageTypes`
  - `SocketData` (`{ userId: string }`, from Phase 0)
- [ ] Gateway: `@WebSocketServer() server!: Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>`
      and typed `Socket` parameters; `handleTyping` parses the payload with the schema, drops invalid payloads
      with an `error` event (`EXT_VALIDATION_001`)
- [ ] Unify the two `error` payloads (`WsConnectionThrottledException.toClientPayload()` and the inline
      `MESSAGE_THROTTLED` objects) on the shared schema; keep `errorCode` (the frontend reads it)
- [ ] Frontend `SocketContext`: `Socket<ServerToClientEvents, ClientToServerEvents>`; the context type and all
      `socket.on/off/emit` in `ContactsContext`, `MessageContext`, `OnlineStatusContext`, `IgnoredUsersContext`,
      `useTypingIndicator`, `useMessageSending`, `useSignOutAction` type-check without casts
- [ ] Optional: in development, validate incoming server events on the client with the schemas (off in production)

**Files:**
- `backend/shared/socket.contract.ts` (new), `backend/shared/socket-message-types.enum.ts`
- `backend/src/modules/socket-gateway/socket.gateway.ts`, `ws-connection-throttler.service.ts`
- `backend/src/errors/ws/ws-connection-throttled.exception.ts`
- `frontend/src/shared/contexts/SocketContext.tsx`, `ContactsContext.tsx`, `MessageContext.tsx`,
  `OnlineStatusContext.tsx`, `IgnoredUsersContext.tsx`
- `frontend/src/shared/hooks/useTypingIndicator.ts`, `useMessageSending.ts`, `useSignOutAction.ts`

## Risks
- **Error and multipart handling in `@orpc/nest`** are the main unknowns; Phase 1 is a go/no-go gate for this reason
- **Single maintainer**: mitigated by OpenAPI-only usage and the committed `openapi.json` (exit: generated client
  + plain Nest controllers, no API change)
- **v1 → v2 churn** if we start on 1.x shortly before 2.0 GA: check the 2.0 changelog in Phase 1 and prefer the
  APIs that 2.0 keeps
- **Side-by-side period**: two clients in `ClientService` for a while; keep Phase 4 groups short-lived
