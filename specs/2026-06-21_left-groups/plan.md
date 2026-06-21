# Left Groups Feature - Plan

## Overview
Prevent users who have left a chat group from receiving messages or having the group auto-added back to their contacts. Enable users to view and rejoin groups they have left.

The core issue is that the existing `leftGroupIds` field on UserEntity is not being checked when messages are sent to groups. This causes users to receive messages from groups they intentionally left.

## Phases

### Phase 1: Backend Message Filtering (Est: 1-2 hours)
- [ ] Add helper method `getActiveGroupMembers()` to MessageService
- [ ] Modify `sendMessage()` in MessageService to filter out members who have left the group
- [ ] Only emit `CONTACT_GROUP_AUTO_ADD` and `MESSAGE_SENT` events for active members

**Files:**
- `backend/src/modules/message/message.service.ts`

### Phase 2: Backend Socket Gateway Filtering (Est: 1 hour)
- [ ] Add defensive check in `CONTACT_GROUP_AUTO_ADD` event handler
- [ ] Query user's `leftGroupIds` before broadcasting `contactGroupAutoAdded`
- [ ] Skip broadcast if user has left the group

**Files:**
- `backend/src/modules/socket-gateway/socket.gateway.ts`

### Phase 3: Frontend Contacts Context Filtering (Est: 1 hour)
- [ ] Modify `handleContactGroupAutoAdded` to check `user.leftGroupIds`
- [ ] Skip auto-adding groups that are in leftGroupIds
- [ ] Modify `updateContactLastMessage` to skip messages from left groups

**Files:**
- `frontend/src/shared/contexts/ContactsContext.tsx`

### Phase 4: Frontend Left Groups Display (Est: 1-2 hours)
- [ ] Use existing `ContactGroupService.getLeftGroups()` to fetch left groups
- [ ] Create UI component to display list of left groups
- [ ] Add rejoin button that calls `ContactGroupService.rejoinContactGroup()`
- [ ] Refresh contactGroups list after successful rejoin

**Files:**
- `frontend/src/[component-path]/LeftGroupsSection.tsx` (or similar)
- Possibly modify existing contacts sidebar component

### Phase 5: Testing & Validation (Est: 1-2 hours)
- [ ] Verify backend filtering prevents events for left group members
- [ ] Verify frontend filtering prevents auto-add for left groups
- [ ] Verify users can see their left groups
- [ ] Verify users can rejoin left groups
- [ ] Verify all existing tests still pass

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/src/modules/message/message.service.ts` | MODIFY | Add `getActiveGroupMembers()` helper, filter members in `sendMessage()` |
| `backend/src/modules/socket-gateway/socket.gateway.ts` | MODIFY | Add leftGroupIds check in CONTACT_GROUP_AUTO_ADD handler |
| `frontend/src/shared/contexts/ContactsContext.tsx` | MODIFY | Filter left groups in `handleContactGroupAutoAdded` and `updateContactLastMessage` |
| `frontend/src/[component]/LeftGroupsSection.tsx` | CREATE | New component for displaying and rejoining left groups |

## Risk Assessment

### Low Risk
- Adding helper method to MessageService
- Frontend context filtering (client-side only)
- Creating new UI component

### Medium Risk
- Modifying `sendMessage()` event emission logic (critical path)
- Socket gateway handler modification (adds DB query per event)

### Mitigation
- Implement backend changes first, verify with tests
- Add defensive checks at multiple layers (backend + frontend)
- Keep changes minimal and focused
- Existing infrastructure already supports the feature (leftGroupIds field, service methods, API endpoints)

## Rollback Strategy
- All changes are isolated to specific methods
- Can revert individual file changes
- No database schema changes required
- No breaking API changes

## Success Criteria
- User leaves group → new messages not received
- User leaves group → group not auto-added back to contacts
- User can view list of groups they have left
- User can rejoin a left group
- Rejoined group receives new messages
- All existing tests pass
- No breaking changes to API contracts
