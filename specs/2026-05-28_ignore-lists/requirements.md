# Ignore Users Feature - Requirements

## Scope

### In Scope
- Add "Ignore" as a third option for incoming contact requests (alongside Accept/Decline)
- Ignored users cannot send messages to the ignoring user
- Ignored users cannot send new contact requests to the ignoring user
- Ignored users appear in a dedicated "Ignored Users" list in the UI
- Ability to un-ignore users (remove from ignore list)
- Ignore relationship is one-directional: User A ignoring User B does not prevent User A from messaging User B

### Out of Scope
- Blocking at the network level (IP blocking, etc.)
- Hiding ignored users from search results
- Automatic cleanup of existing messages from ignored users
- Notifications for ignored users
- Admin/moderation tools for managing ignores

## Context

Currently, when User A sends a contact request to User B, User B can:
1. **Accept** - adds User A as a contact, enabling messaging
2. **Decline** - rejects the request, but User A can send another request later

The gap: There is no persistent way to prevent a specific user from sending repeated contact requests or messages. The Ignore feature fills this gap by providing a stronger "do not interact" signal.

This feature aligns with common messaging app patterns (WhatsApp, Telegram, Signal all have block/ignore functionality).

## Decisions

| Decision | Rationale |
|----------|-----------|
| One-directional ignore | Matches user expectations: ignoring someone doesn't affect your ability to message them (you can still reach out if you change your mind) |
| Persistent ignore | Ignored status persists across sessions and devices |
| Separate from contacts | Ignored users are not contacts and cannot become contacts without first being un-ignored |
| Separate from decline | Decline is temporary; Ignore is persistent. Decline allows re-request; Ignore prevents it |
| No message deletion | Existing messages remain visible for audit/transparency |
| Real-time sync | Ignore status updates propagate via WebSocket to all connected clients |
| **Separate collection** | Store ignored users in dedicated `ignoredUsers` collection with compound index `(userId, ignoredUserId)` for O(1) lookups |
