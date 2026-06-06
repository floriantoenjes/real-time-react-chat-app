# Decouple Services with Event Bus - Plan

## Overview
Reduce tight coupling between backend services by introducing an event-driven architecture using NestJS EventEmitter2. This allows services to communicate asynchronously without direct dependencies.

## Phases

### Phase 1: Foundation (Est: 1-2 hours)
- [ ] Create `EventBusService` wrapper around `@nestjs/event-emitter`
- [ ] Define event types and payload interfaces in `events/` directory
- [ ] Add `EventEmitterModule.forRoot()` to app module

### Phase 2: MessageService Refactoring (Est: 2-3 hours)
- [ ] Replace direct `ContactService.addContactIfNotExists()` calls with events
- [ ] Replace direct `RealTimeChatGateway` calls with events
- [ ] Replace direct `IgnoredUserService.isUserIgnored()` checks (keep for now - validation required)
- [ ] Remove `ContactService`, `ContactGroupService`, `IgnoredUserService` from MessageService constructor

### Phase 3: Listener Services (Est: 2-3 hours)
- [ ] Create event listeners in `ContactService` for auto-add contact logic
- [ ] Create event listeners in `IgnoredUserService` for ignore/unignore notifications
- [ ] Create event listeners in `RealTimeChatGateway` for message/read events

### Phase 4: ContactRequestService (Est: 1-2 hours)
- [ ] Replace direct `IgnoredUserService.ignoreUser()` with event emission
- [ ] Remove `IgnoredUserService` dependency

### Phase 5: IgnoredUserService (Est: 1 hour)
- [ ] Remove `RealTimeChatGateway` dependency
- [ ] Emit events instead of direct gateway calls

### Phase 6: Cleanup (Est: 1 hour)
- [ ] Remove `forwardRef` usages
- [ ] Update all service tests to work with new structure
- [ ] Remove unused imports

## File Changes Summary

| File | Action | Dependencies Removed | Dependencies Added |
|------|--------|----------------------|-------------------|
| `event-bus.service.ts` | CREATE | - | EventEmitter2 |
| `events/` | CREATE | - | - |
| `message.service.ts` | MODIFY | ContactService, ContactGroupService, IgnoredUserService, UserService | EventBusService |
| `contact.service.ts` | MODIFY | - | EventBusService |
| `ignored-user.service.ts` | MODIFY | RealTimeChatGateway | EventBusService |
| `contact-request.service.ts` | MODIFY | IgnoredUserService | EventBusService |
| `app.module.ts` | MODIFY | - | EventEmitterModule |

## Risk Assessment

### Low Risk
- EventBusService creation
- Adding EventEmitterModule to app
- Defining event types

### Medium Risk
- Removing direct service calls from MessageService
- Need to ensure event listeners are properly registered

### Mitigation
- Implement one event flow at a time
- Run tests after each phase
- Keep old direct calls commented out until new flow verified

## Rollback Strategy
- All changes are additive initially (new files, new methods)
- Direct service calls can be restored by reverting individual commits
- Feature flags possible for gradual rollout

## Success Criteria
- MessageService constructor has ≤3 dependencies (from 7)
- No `forwardRef` usage in services
- All existing tests pass
- No breaking changes to API contracts
