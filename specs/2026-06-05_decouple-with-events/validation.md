# Decouple Services with Event Bus - Validation

## Validation Strategy

### 1. Unit Test Validation

#### MessageService Tests
```bash
# Run existing tests - must all pass
npm run test -- message.service.spec.ts
```

**Test Coverage to Verify:**
- [ ] `sendMessage()` still works correctly
- [ ] Auto-add contact still happens when message sent to non-contact
- [ ] Auto-add group still happens when message sent to group
- [ ] Ignored user check still prevents message sending
- [ ] Message read events still emitted via WebSocket
- [ ] `deleteMessages()` still works
- [ ] `uploadFileAsMessage()` still works

#### ContactService Tests
```bash
npm run test -- contact.service.spec.ts
```

**Test Coverage:**
- [ ] `addContactIfNotExists()` still called via event listener
- [ ] Online status checking still works
- [ ] Ignored user check still works

#### IgnoredUserService Tests
```bash
npm run test -- ignored-user.service.spec.ts
```

**Test Coverage:**
- [ ] `ignoreUser()` still works
- [ ] `unignoreUser()` still works
- [ ] WebSocket events still emitted
- [ ] Contact removal still happens

### 2. Integration Test Validation

#### Manual API Tests

**POST /api/messages/send**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"toUserId": "<user2-id>", "message": "test", "type": "text"}'
```

**Verify:**
- [ ] Response: 201 with message data
- [ ] User2 receives message via WebSocket
- [ ] If user2 not in contacts, they are auto-added
- [ ] If user1 ignored user2, returns 403

**POST /api/users/ignore**
```bash
curl -X POST http://localhost:3000/api/users/ignore/<user2-id> \
  -H "Authorization: Bearer <token>"
```

**Verify:**
- [ ] Response: 201
- [ ] User2 removed from contacts
- [ ] User receives `userIgnored` WebSocket event
- [ ] Cannot send message to ignored user

### 3. Dependency Validation

#### Before Refactoring
```bash
# Check current dependency count
grep -n "constructor" src/services/message.service.ts | head -1
# Expected: 7+ constructor parameters
```

#### After Refactoring
```bash
# Check reduced dependency count
grep -n "constructor" src/services/message.service.ts | head -1
# Expected: 2-3 constructor parameters
```

**Dependency Count Targets:**
| Service | Current | Target | Status |
|---------|---------|--------|--------|
| MessageService | 7 | ≤3 | [ ] |
| ContactService | 4 | ≤3 | [ ] |
| IgnoredUserService | 3 | ≤2 | [ ] |
| ContactRequestService | 2 | ≤2 | [ ] |

### 4. Circular Dependency Validation

```bash
# Check for forwardRef usage - should be 0
rg "forwardRef" src/services/ | wc -l
# Expected: 0
```

### 5. Event Flow Validation

**Test Event Flow:**
```typescript
// In a test or manually verify:
// 1. MessageService emits message.sent
// 2. ContactService listener receives it
// 3. ContactService auto-adds contact
// 4. RealTimeChatGateway listener receives it
// 5. Gateway emits message to receiver
```

**Verification Queries:**
```bash
# Check event bus is being used
rg "eventBus.emit" src/services/
rg "eventBus.on\|@OnEvent" src/services/
```

### 6. Performance Validation

**Before:**
```bash
# Measure sendMessage endpoint response time
# Run 100 requests, measure avg response time
```

**After:**
```bash
# Same measurement
# Expected: <10ms increase in average response time
```

### 7. Build Validation

```bash
# Build must succeed
npm run build

# Lint must pass
npm run lint

# Type check must pass
npm run type-check
```

## Acceptance Criteria Checklist

- [ ] All existing unit tests pass
- [ ] All existing integration tests pass
- [ ] Manual API tests pass
- [ ] No circular dependencies (no `forwardRef`)
- [ ] MessageService has ≤3 constructor dependencies
- [ ] IgnoredUserService has ≤2 constructor dependencies
- [ ] Build, lint, and type-check all pass
- [ ] No breaking changes to API
- [ ] No new external dependencies beyond `@nestjs/event-emitter`

## Validation Commands

```bash
# Run all validation
npm run test && npm run build && npm run lint

# Check circular deps
npx madge --circular src/services/

# Check dependency injection graph
npx @nestjs/schematics:dependencies-tree
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Service dependency reduction | 50% | Count constructor params |
| Circular dependencies | 0 | `madge --circular` |
| Test coverage | 100% | Existing test suite |
| Performance impact | <10ms | Load testing |
| Build time impact | <5s | `time npm run build` |
