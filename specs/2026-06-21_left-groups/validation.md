# Left Groups Feature - Validation

## Validation Strategy

### 1. Unit Test Validation

#### MessageService Tests
```bash
# Run existing tests - must all pass
npm run test -- message.service.spec.ts
```

**Test Coverage to Verify:**
- [ ] `sendMessage()` to contact group only emits events for active members
- [ ] `sendMessage()` does NOT emit `CONTACT_GROUP_AUTO_ADD` for members who left
- [ ] `sendMessage()` does NOT emit `MESSAGE_SENT` for members who left
- [ ] `sendMessage()` still works correctly for direct messages
- [ ] `sendMessage()` still works correctly for active group members
- [ ] `deleteMessages()` still works
- [ ] `uploadFileAsMessage()` still works

**New Tests to Add:**
```typescript
// In message.service.spec.ts
it('should not emit events for users who have left the group', async () => {
    // Setup: user1 leaves group, user2 sends message to group
    // Verify: user1 does NOT receive CONTACT_GROUP_AUTO_ADD or MESSAGE_SENT
});

it('should emit events for active group members only', async () => {
    // Setup: group with user1 (active), user2 (left), user3 (active)
    // user1 sends message
    // Verify: user1 and user3 receive events, user2 does not
});
```

#### SocketGateway Tests
```bash
npm run test -- socket.gateway.spec.ts
```

**Test Coverage to Verify:**
- [ ] `CONTACT_GROUP_AUTO_ADD` handler skips users who have left the group
- [ ] `CONTACT_GROUP_AUTO_ADD` handler still broadcasts for active members
- [ ] Other event handlers still work correctly

**New Tests to Add:**
```typescript
// In socket.gateway.spec.ts or integration test
it('should not broadcast contactGroupAutoAdded for left groups', async () => {
    // Setup: user has left groupX
    // Emit CONTACT_GROUP_AUTO_ADD with groupX
    // Verify: socket.to(userId) does NOT emit contactGroupAutoAdded
});
```

#### ContactGroupService Tests
```bash
npm run test -- contact-group.service.spec.ts
```

**Test Coverage to Verify:**
- [ ] `getLeftGroups()` returns correct groups
- [ ] `rejoinContactGroup()` moves group from leftGroupIds to contactGroupIds
- [ ] `rejoinContactGroup()` returns the group data
- [ ] Existing leaveContactGroup tests still pass

### 2. Integration Test Validation

#### Manual API Tests

**POST /api/contact-groups/leave**
```bash
curl -X POST http://localhost:3000/api/contact-groups/leave \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contactGroupId": "<group-id>"}'
```

**Verify:**
- [ ] Response: 200 with true
- [ ] Group removed from user's contactGroupIds
- [ ] Group added to user's leftGroupIds

**POST /api/contact-groups/rejoin**
```bash
curl -X POST http://localhost:3000/api/contact-groups/rejoin \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contactGroupId": "<group-id>"}'
```

**Verify:**
- [ ] Response: 200 with group data
- [ ] Group removed from user's leftGroupIds
- [ ] Group added to user's contactGroupIds

**GET /api/contact-groups/left**
```bash
curl -X POST http://localhost:3000/api/contact-groups/left \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

**Verify:**
- [ ] Response: 200 with array of left groups
- [ ] Only groups user has left are returned
- [ ] Groups have correct structure (name, memberRefs, etc.)

**POST /api/messages/send** (to group)
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"toUserId": "<group-id>", "message": "test message", "type": "text"}'
```

**Verify (for active member):**
- [ ] Response: 201 with message data
- [ ] Active member receives message via WebSocket
- [ ] Active member's group shows new lastMessage

**Verify (for left member):**
- [ ] Response: 201 with message data (sender succeeds)
- [ ] Left member does NOT receive message via WebSocket
- [ ] Left member does NOT get group auto-added
- [ ] Left member's lastMessage unchanged

### 3. Frontend Validation

#### ContactsContext Behavior
- [ ] `handleContactGroupAutoAdded` does not add groups in leftGroupIds
- [ ] `updateContactLastMessage` does not update lastMessage for left groups
- [ ] Active groups still auto-add correctly
- [ ] Active group messages still update lastMessage

#### ContactGroupService Usage
- [ ] `getLeftGroups()` successfully fetches left groups
- [ ] `rejoinContactGroup()` successfully rejoins group
- [ ] Rejoined group appears in active contactGroups
- [ ] Rejoined group disappears from leftGroups

### 4. End-to-End Flow Validation

**Full Flow Test:**
1. User1, User2, User3 in GroupX
2. User1 leaves GroupX
3. User2 sends message to GroupX
4. Verify User1 does NOT receive message
5. Verify User1 does NOT get GroupX auto-added
6. Verify User3 DOES receive message
7. User1 calls getLeftGroups
8. Verify GroupX is in returned list
9. User1 rejoins GroupX
10. Verify GroupX is in active contactGroups
11. User2 sends another message to GroupX
12. Verify User1 NOW receives message

### 5. Build Validation

```bash
# Build must succeed
npm run build

# Backend build
cd backend && npm run build

# Frontend build
cd frontend && npm run build

# Lint must pass
npm run lint

# Type check must pass
npm run type-check
```

## Acceptance Criteria Checklist

- [ ] All existing unit tests pass
- [ ] New unit tests added and pass
- [ ] All existing integration tests pass
- [ ] Manual API tests pass for leave/rejoin/left-groups endpoints
- [ ] Users who leave a group do not receive new messages
- [ ] Users who leave a group do not get it auto-added back
- [ ] Users can view list of groups they have left
- [ ] Users can rejoin a left group
- [ ] Rejoined groups receive new messages
- [ ] Build, lint, and type-check all pass
- [ ] No breaking changes to API
- [ ] No new external dependencies

## Validation Commands

```bash
# Run all backend tests
cd backend && npm run test

# Run specific test files
cd backend && npm run test -- message.service.spec.ts
cd backend && npm run test -- contact-group.service.spec.ts

# Run frontend tests
cd frontend && npm run test

# Full build and validation
npm run build && npm run lint && npm run type-check
```

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test pass rate | 100% | Existing + new tests |
| Message filtering | 100% | Left users receive 0 messages |
| Auto-add filtering | 100% | Left users have 0 auto-adds |
| Build success | Yes | `npm run build` |
| Lint success | Yes | `npm run lint` |
| Type check success | Yes | `npm run type-check` |
| Performance impact | <10ms | Message send latency |
