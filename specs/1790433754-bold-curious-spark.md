# Plan: Complete Left Groups Feature Implementation

## Overview
The "Left Groups" feature is partially implemented. Core backend message filtering and API endpoints exist, but critical frontend and backend socket gateway filtering is missing. Users can still receive messages and have groups auto-added back after leaving them.

## Problem Analysis

### What's Already Done (from commits d1388cb, d82372a, 8f379da)

**Backend (message.service.ts):**
- ✅ `getActiveGroupMembers(groupId, allMemberIds)` - returns member IDs who have NOT left the group
- ✅ `sendMessage()` filters out left group members before emitting events
- ✅ Only emits `CONTACT_GROUP_AUTO_ADD` and `MESSAGE_SENT` for active members

**Backend (contact-group.service.ts):**
- ✅ `leaveContactGroup()` - moves group ID from contactGroupIds to leftGroupIds
- ✅ `rejoinContactGroup()` - moves group ID from leftGroupIds back to contactGroupIds
- ✅ `getLeftGroups()` - fetches groups user has left

**Frontend:**
- ✅ `ContactGroupService` with `getLeftGroups()`, `rejoinContactGroup()`, `leaveContactGroup()`
- ✅ `LeftGroupsList.tsx` component with rejoin functionality
- ✅ Integration in sidebar `TopSection.tsx`
- ✅ `ContactsContext` with `leftGroups` state, `rejoinGroup()`, `leaveGroup()` methods
- ✅ i18n translations (en, de)

**User Model:**
- ✅ `leftGroupIds: string[]` field exists in UserSchema (user.contract.ts)

### Critical Gaps

**1. Frontend ContactsContext - Missing Group Auto-Add Filtering**
- ❌ `handleContactGroupAutoAdded` does NOT check if group is in user's `leftGroupIds`
- ❌ Result: Groups get auto-added back to contacts even after user left them
- Location: `frontend/src/shared/contexts/ContactsContext.tsx` lines 151-161

**2. Frontend ContactsContext - Missing Message Update Filtering**
- ❌ `updateContactLastMessage` does NOT check if message is from a left group
- ❌ Result: lastMessage gets updated for left groups, making them reappear in contacts
- Location: `frontend/src/shared/contexts/ContactsContext.tsx` lines 144-163

**3. Backend SocketGateway - Missing Defensive Check**
- ❌ `CONTACT_GROUP_AUTO_ADD` handler does NOT verify user hasn't left the group
- ❌ Result: Even if MessageService filters correctly, direct socket events could bypass filtering
- Location: `backend/src/modules/socket-gateway/socket.gateway.ts` lines 119-132

## Implementation Plan

### Phase 1: Frontend ContactsContext Filtering (High Priority) - COMPLETED ✅

**Task 1.1: Filter handleContactGroupAutoAdded** - COMPLETED ✅
- Added check: if `newContactGroup._id` is in `user.leftGroupIds`, skip auto-add
- Uses user from UserContext
- Location: `frontend/src/shared/contexts/ContactsContext.tsx` line 84

**Task 1.2: Filter updateContactLastMessage** - COMPLETED ✅
- Added check: if `message.toUserId` is a left group (in user's leftGroupIds), skip update
- Prevents left groups from showing new messages and reappearing
- Location: `frontend/src/shared/contexts/ContactsContext.tsx` line 150

**Dependencies:** UserContext already provides user with leftGroupIds

### Phase 2: Backend SocketGateway Defensive Check (High Priority) - COMPLETED ✅

**Task 2.1: Add leftGroupIds check in CONTACT_GROUP_AUTO_ADD handler** - COMPLETED ✅
- Added async handler to query user's leftGroupIds before broadcasting
- Skips broadcast if user has left the group
- Added injection of UserModel to SocketGateway
- Location: `backend/src/modules/socket-gateway/socket.gateway.ts` lines 123-140

**Note:** This is a defensive check. The primary filtering happens in MessageService, but this ensures no edge cases slip through.

### Phase 3: Testing & Validation

**Test Strategy:**
1. User1, User2 in GroupX
2. User1 leaves GroupX (via leaveGroup)
3. User2 sends message to GroupX
4. Verify: User1 does NOT receive message via WebSocket
5. Verify: User1 does NOT get GroupX auto-added to contacts
6. Verify: User1's contactGroups does NOT show lastMessage update
7. User1 calls getLeftGroups
8. Verify: GroupX is in returned list
9. User1 rejoins GroupX
10. Verify: GroupX is in active contactGroups
11. User2 sends another message
12. Verify: User1 NOW receives message

### Phase 4: Edge Cases

- Multiple users leaving/joining
- User leaves then rejoins quickly
- Group with all members having left
- Message sent to group where some members left

## Files Modified

| File | Action | Description | Status |
|------|--------|-------------|--------|
| `frontend/src/shared/contexts/ContactsContext.tsx` | MODIFY | Add leftGroupIds check in handleContactGroupAutoAdded and updateContactLastMessage | ✅ COMPLETED |
| `backend/src/modules/socket-gateway/socket.gateway.ts` | MODIFY | Add leftGroupIds check in CONTACT_GROUP_AUTO_ADD handler, inject UserModel | ✅ COMPLETED |

## Changes Summary

### Frontend Changes (ContactsContext.tsx)
1. Added leftGroupIds check in `handleContactGroupAutoAdded` handler
2. Added leftGroupIds check in `updateContactLastMessage` function

### Backend Changes (socket.gateway.ts)
1. Added imports: `InjectModel`, `UserEntity`, `Model` from mongoose
2. Added `@InjectModel(UserEntity.name)` and `userModel: Model<UserEntity>` to constructor
3. Modified `CONTACT_GROUP_AUTO_ADD` handler to be async and check user's leftGroupIds before broadcasting

## Risk Assessment

### Low Risk
- Frontend filtering (client-side only, defensive)
- Adding UserModel injection to SocketGateway

### Medium Risk
- Backend SocketGateway handler modification (adds DB query per event)

### Mitigation
- Implement frontend changes first (easier to test)
- Add defensive checks at multiple layers
- Changes are minimal and isolated
- Existing infrastructure already supports the feature

## Success Criteria

- [ ] Users who leave a group do NOT receive new messages from that group
- [ ] Users who leave a group do NOT have it auto-added back to their contacts
- [ ] Users can view list of groups they have left
- [ ] Users can rejoin a left group
- [ ] Rejoined groups receive new messages
- [ ] All existing tests pass
- [ ] No breaking changes to API contracts

## Validation Checklist

From validation.md:
- [ ] `handleContactGroupAutoAdded` does not add groups in leftGroupIds
- [ ] `updateContactLastMessage` does not update lastMessage for left groups  
- [ ] SocketGateway `CONTACT_GROUP_AUTO_ADD` handler skips users who left
- [ ] All existing unit tests pass
- [ ] Manual E2E flow test passes
- [ ] Build, lint, type-check all pass

## Implementation Status

### Completed ✅
- [x] Frontend ContactsContext filtering (handleContactGroupAutoAdded)
- [x] Frontend ContactsContext filtering (updateContactLastMessage)
- [x] Backend SocketGateway defensive check (CONTACT_GROUP_AUTO_ADD handler)
- [x] Backend builds successfully
- [x] Frontend builds successfully

### Next Steps
- [ ] Run existing tests to verify no regressions
- [ ] Manual testing of the complete flow
- [ ] Verify all acceptance criteria
