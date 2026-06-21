# Left Groups Feature - Requirements

## Must Have

### Functional Requirements
- [ ] Users who leave a group must NOT receive new messages from that group
- [ ] Users who leave a group must NOT have the group auto-added back to their contacts when messages are sent
- [ ] Users must be able to view a list of groups they have left
- [ ] Users must be able to rejoin a group they have left
- [ ] Rejoining a group must restore message delivery and auto-add behavior
- [ ] All existing group messaging functionality must continue to work for active members

### Non-Functional Requirements
- [ ] No breaking changes to existing REST API endpoints
- [ ] No breaking changes to existing WebSocket event types
- [ ] No performance degradation for message sending (>10ms added latency)
- [ ] All existing unit and integration tests must pass
- [ ] No new external dependencies required

### Technical Requirements
- [ ] Use existing `leftGroupIds` field on UserEntity as the source of truth
- [ ] Use existing `ContactGroupService.getLeftGroups()` method
- [ ] Use existing `ContactGroupService.rejoinContactGroup()` method
- [ ] Use existing `contactGroupContract` endpoints
- [ ] Use existing frontend `ContactGroupService` methods
- [ ] Check `leftGroupIds` before emitting `CONTACT_GROUP_AUTO_ADD` events
- [ ] Check `leftGroupIds` before emitting `MESSAGE_SENT` events for groups
- [ ] Check `leftGroupIds` in frontend before auto-adding groups

### Data Model Requirements
- [ ] User document must maintain `leftGroupIds: string[]` 
- [ ] Group ID must be moved from `contactGroupIds` to `leftGroupIds` when user leaves
- [ ] Group ID must be moved from `leftGroupIds` to `contactGroupIds` when user rejoins
- [ ] No changes to ContactGroup schema required

## Must Not Have

### Anti-Requirements
- [ ] Do NOT change the User or ContactGroup database schema
- [ ] Do NOT change existing WebSocket API (event types, payloads)
- [ ] Do NOT change existing REST API (routes, request/response formats)
- [ ] Do NOT remove existing functionality
- [ ] Do NOT introduce new external dependencies
- [ ] Do NOT modify existing event names or payload structures

## Constraints
- NestJS v10.x compatible
- Must work with existing Mongoose models
- Must work with existing Socket.IO gateway
- Must work with existing event bus implementation
- Must maintain existing logging format and levels
- Must maintain existing error types and exception handling
- Existing `leftGroupIds` infrastructure must be reused (not reimplemented)

## Dependencies
- No new dependencies required
- Existing infrastructure:
  - `@nestjs/event-emitter` (already in project)
  - Existing UserEntity with leftGroupIds
  - Existing ContactGroupService methods
  - Existing API contracts

## Out of Scope
- Repository pattern implementation
- Domain-driven design refactoring
- Introducing external message brokers
- Changing authentication/authorization logic
- Modifying existing test infrastructure
- Cleanup of old/left groups (future enhancement)
- Notifications for when users leave/join groups (future enhancement)
