# oRPC Migration & Typed Socket Contract - Requirements

## Context
ts-rest is no longer maintained. It also blocks Zod 4 and NestJS 12 (see the deferred upgrade decision). The HTTP
API moves to oRPC (https://orpc.dev), which, like ts-rest, puts a contract first: shared contracts in
`backend/shared/`, implemented by NestJS controllers through `@orpc/nest`, consumed by a typed client in the
frontend.

oRPC is mostly maintained by one person, the same risk ts-rest had. The migration is therefore designed for the
exit: every procedure keeps an explicit REST route and goes through oRPC's **OpenAPI** handler/link, never the
oRPC RPC protocol. Requests stay plain HTTP/JSON, and the API is fully described by a generated OpenAPI document.
If oRPC is abandoned, a client can be generated from that document (e.g. `openapi-typescript` + `openapi-fetch`)
and the controllers can be implemented with plain Nest, without changing the API.

Socket.IO stays as the real-time transport (rooms, Redis adapter across replicas, reconnection, presence).
oRPC's WebSocket support is out of scope: it is partly experimental and has no rooms, multi-node fan-out or
reconnection. Instead, the socket events get a shared typed contract with Zod schemas, using Socket.IO's
built-in typed `Server`/`Socket` generics.

While analysing the gateway, a security issue showed up: `handleConnection` verifies the access token, but joins
the room named by the client-supplied `handshake.query.userId` instead of the token's `sub`, and `typing`
forwards the client-supplied `payload.userId`. Any signed-in user can join another user's room and receive their
messages, or send typing events in someone else's name. This must be fixed **before** the migration, as a
separate small PR (Phase 0 of the plan).

## Inventory (as of 2026-11-01)
- 11 ts-rest contracts in `backend/shared/*.contract.ts` (~620 lines): auth, contact, contact-group,
  contact-request, coturn, file, ignored-user, logging, message, online-status, user
- 13 controllers using `@TsRestHandler`/`tsRestHandler`
- 6 services return ts-rest shaped `{ status, body }` objects (message, user, online-status, contact,
  contact-group + `message.service.spec.ts`)
- `GlobalExceptionFilter` and `InvalidRequestException` depend on `RequestValidationError` from `@ts-rest/nest`
- Frontend: generic `ClientService` (custom fetch with 401 → refresh → retry, error-code snackbar) plus 10 service
  classes; ~23 `res.status === …` checks
- Socket: `SocketMessageTypes` enum, `RealTimeChatGateway`, and 7 frontend contexts/hooks with untyped
  `socket.on`/`emit`

## Must Have

### Functional Requirements
- [ ] Every existing HTTP endpoint keeps its method, path, request shape, success status and response body
      (the only allowed exception is `loadFile`, see Technical Requirements)
- [ ] Error responses keep their current shape (`{ errorCode, message, … }` from `ClientFriendlyHttpException`)
      and status codes, so the frontend snackbar translations keep working
- [ ] Invalid requests still return 400 with `EXT_VALIDATION_001` and the failing fields
- [ ] Rate limits (`@StrictThrottle`, `@AuthThrottle`, global throttler → 429 + `Retry-After`), auth guard,
      `@UserId()`, cookies set in `AuthController`, and the file size limit (413) behave as today
- [ ] The frontend's 401 → `/refresh` → retry once → sign out on failure flow behaves as today
- [ ] Socket events keep their names and payloads; the frontend's behaviour on every event is unchanged
- [ ] The backend serves the generated OpenAPI document (`GET /openapi.json`), and a copy is committed to the repo

### Security Requirements
- [ ] (Phase 0) The socket room and `userId` come from the verified JWT `sub` only; `handshake.query.userId` and
      `payload.userId` are ignored
- [ ] Incoming socket payloads (`typing`) are validated with Zod; invalid payloads are dropped with a
      `EXT_VALIDATION_001` `error` event
- [ ] The OpenAPI document does not expose anything that isn't reachable today (no new routes)
- [ ] Every new package is vetted for compromise/supply-chain reports before install (per `CLAUDE.md`)

### Non-Functional Requirements
- [ ] The migration can be done one contract at a time: ts-rest and oRPC routes run side by side until the last
      contract is migrated, and every intermediate state is releasable
- [ ] No performance regression on message send/load (same number of requests; no RPC batching)
- [ ] All existing unit tests and the full e2e suite pass after each phase, without changes to e2e tests except
      for the `loadFile` wire change
- [ ] Frontend type-checks with no `any` casts in the new client code (today `FileService` casts to `any`)

### Technical Requirements
- [ ] `@orpc/contract`, `@orpc/server`, `@orpc/nest`, `@orpc/client`, `@orpc/openapi`, `@orpc/openapi-client`,
      `@orpc/zod` (major version decided in Phase 1: stable 1.x unless 2.0 is GA)
- [ ] Zod bumped within 3.x to a version that implements Standard Schema (≥ 3.24); Zod 4 stays out of scope here
- [ ] Contracts use `oc.route({ method, path, successStatus })` on every procedure, no RPC-only procedures
- [ ] Server uses `@orpc/nest` `@Implement(...)`; client uses `OpenAPILink` (not `RPCLink`)
- [ ] Services return plain domain values and throw the existing `ClientFriendlyHttpException` subclasses for
      errors; the `{ status, body }` shape is removed from services
- [ ] `loadFile` returns binary data (`Blob`/`File`) instead of a JSON-serialised `Uint8Array`
      (today the body is a `{ "0": …, "1": … }` object); backend and frontend change together
- [ ] Shared socket contract in `backend/shared/socket.contract.ts`: Zod schemas per event payload,
      `ServerToClientEvents` and `ClientToServerEvents` interfaces derived from them, used as
      `Server<ClientToServerEvents, ServerToClientEvents>` in the gateway and `Socket<ServerToClientEvents,
      ClientToServerEvents>` in `SocketContext`
- [ ] The `error` socket event gets one typed payload (today two different shapes are emitted)
- [ ] `@ts-rest/core` and `@ts-rest/nest` are removed from both `package.json` files at the end

## Must Not Have

### Anti-Requirements
- [ ] Do NOT use the oRPC RPC protocol (`RPCHandler`/`RPCLink`); OpenAPI handler/link only
- [ ] Do NOT replace Socket.IO with oRPC WebSockets or event iterators in this migration
- [ ] Do NOT change routes, methods or payloads (except `loadFile`), even where they aren't RESTful today
      (`POST /get-messages` etc.); cleaning those up is a separate change
- [ ] Do NOT upgrade to Zod 4 or NestJS 12 in the same PR series; that comes after, once ts-rest is gone
- [ ] Do NOT add oRPC-specific features that have no OpenAPI equivalent (batching, RPC streaming, durable
      iterators), so the exit path stays open
- [ ] Do NOT do the Phase 0 security fix inside the migration PRs; ship it on its own first

## Constraints
- NestJS 11 / Express adapter stays (`@nestjs/platform-express`, Multer today)
- Frontend imports shared contracts through the `@t/*` path alias (`frontend/tsconfig.json`), so contracts must
  not import backend-only code
- Must work with several backend replicas and the Redis Socket.IO adapter
- Docker/gh are blocked in the sandbox; e2e runs and PR creation are done by the user
