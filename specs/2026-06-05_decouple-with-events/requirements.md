# Decouple Services with Event Bus - Requirements

## Must Have

### Functional Requirements
- [ ] Services must emit events for cross-cutting concerns (message sent, user ignored, etc.)
- [ ] Event listeners must handle the same logic currently done via direct service calls
- [ ] All existing API endpoints must continue to work with identical responses
- [ ] All existing WebSocket events must continue to be emitted
- [ ] Error handling must maintain same behavior (exceptions, logging)

### Non-Functional Requirements
- [ ] No breaking changes to public service APIs
- [ ] No performance degradation (events should not add >10ms latency)
- [ ] Memory footprint increase <5MB
- [ ] All existing unit tests must pass without modification to test code

### Technical Requirements
- [ ] Use `@nestjs/event-emitter` package (already in project or add v2.x)
- [ ] Event payloads must be typed with TypeScript interfaces
- [ ] Event names must follow pattern: `<entity>.<action>` (e.g., `message.sent`, `user.ignored`)
- [ ] Events must be async (non-blocking)
- [ ] No circular dependencies introduced
- [ ] Services must not directly inject other services for cross-cutting concerns

### Event Definitions

#### Message Events
```typescript
interface MessageSentEvent {
    fromUserId: string;
    toUserId: string;
    messageId: string;
    message: Message;
    isGroup: boolean;
}

interface MessageReadEvent {
    messageId: string;
    readerUserId: string;
}
```

#### Contact Events
```typescript
interface ContactAutoAddEvent {
    userId: string;        // User to add contact to
    contactUserId: string; // Contact to add
}

interface ContactGroupAutoAddEvent {
    userId: string;
    group: ContactGroup;
}
```

#### User Events
```typescript
interface UserIgnoredEvent {
    userId: string;        // User who did the ignoring
    ignoredUserId: string;
}

interface UserUnignoredEvent {
    userId: string;
    unignoredUserId: string;
}
```

## Must Not Have

### Anti-Requirements
- [ ] Do NOT change the database schema
- [ ] Do NOT change the WebSocket API (event types, payloads)
- [ ] Do NOT change the REST API (routes, request/response formats)
- [ ] Do NOT remove existing direct method calls within the same service (only cross-service calls)
- [ ] Do NOT introduce new external dependencies beyond `@nestjs/event-emitter`
- [ ] Do NOT use a message queue (RabbitMQ, Kafka) - keep it in-memory for now

## Constraints
- NestJS v10.x compatible
- Must work with existing Mongoose models
- Must work with existing Socket.IO gateway
- Must maintain existing logging format and levels
- Must maintain existing error types and exception handling

## Dependencies
- `@nestjs/event-emitter` >= 2.0.0
- Existing NestJS common, core packages

## Out of Scope
- Repository pattern implementation
- Domain-driven design refactoring
- Moving to CQRS pattern
- Introducing external message brokers
- Changing authentication/authorization logic
- Refactoring frontend code
