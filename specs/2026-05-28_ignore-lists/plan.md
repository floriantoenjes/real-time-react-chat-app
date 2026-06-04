# Ignore Users Feature - Implementation Plan

## Data Model Decision

**Separate collection** `ignoredUsers` with compound unique index:

```typescript
// backend/src/schemas/ignored-user.schema.ts
@Schema({ collection: 'ignoredUsers' })
export class IgnoredUserEntity {
    @Prop({ required: true, index: true })
    userId!: string;          // User who owns the ignore list
    
    @Prop({ required: true, index: true })
    ignoredUserId!: string;   // User being ignored
    
    @Prop({ default: Date.now })
    createdAt!: Date;
}

IgnoredUserSchema.index({ userId: 1, ignoredUserId: 1 }, { unique: true });
```

**Rationale**: Enables O(1) lookups via compound index, scales well, follows existing patterns (ContactRequest, ContactGroup).

## Task Groups

### 1. Backend - Data Model & Schema
1.1 Create `IgnoredUserEntity` class and `IgnoredUserSchema` in `schemas/ignored-user.schema.ts`
1.2 Register schema in `app.module.ts` MongooseModule.forFeature()
1.3 Add compound unique index on `(userId, ignoredUserId)`
1.4 Add individual indexes on `userId` and `ignoredUserId`

### 2. Backend - Service Layer
2.1 Create `IgnoredUsersService` with methods:
- `ignoreUser(userId, ignoredUserId)`
- `unignoreUser(userId, ignoredUserId)`
- `getIgnoredUsers(userId, pagination)`
- `isUserIgnored(userId, targetUserId)`
2.2 Add validation: cannot ignore self
2.3 Add validation: cannot ignore already-ignored user

### 3. Backend - API Endpoints
3.1 Create ts-rest contract for ignore operations in `contracts/ignored-users.contract.ts`
3.2 Implement `POST /contact-requests/{id}/ignore` endpoint
3.3 Implement `DELETE /ignored-users/{userId}` endpoint
3.4 Implement `GET /ignored-users` endpoint
3.5 Add Zod validation for all request/response types

### 4. Backend - Middleware/Guards
4.1 Create `IgnoreCheckGuard` or middleware to check ignore status
4.2 Apply guard to message creation endpoint
4.3 Apply guard to contact request creation endpoint
4.4 Return 403 Forbidden with appropriate error message

### 5. Backend - Real-time Updates
5.1 Emit WebSocket event `user:ignored` when user is ignored
5.2 Emit WebSocket event `user:unignored` when user is un-ignored
5.3 Update online clients with new ignore status

### 6. Frontend - API Client
6.1 Generate API client from ts-rest contract
6.2 Add ignoreUser mutation hook
6.3 Add unignoreUser mutation hook
6.4 Add getIgnoredUsers query hook

### 7. Frontend - UI Components
7.1 Add "Ignore" button to `ContactRequestCard` component
7.2 Add "Ignore" button to user profile view
7.3 Create `IgnoredUsersList` component
7.4 Create `IgnoreConfirmationDialog` component
7.5 Add "Un-ignore" action to ignored user entries

### 8. Frontend - State Management
8.1 Create `IgnoredUsersContext` with `ignoredUserIds: string[]` state
8.2 Add `IgnoredUsersProvider` component that fetches ignored users on mount
8.3 Handle WebSocket events for ignore status updates in provider
8.4 Update contact list to filter out ignored users
8.5 Update message list to filter out messages from ignored users

### 9. Frontend - Real-time Integration
9.1 Subscribe to `user:ignored` and `user:unignored` WebSocket events in `IgnoredUsersProvider`
9.2 Update context state on ignore status change
9.3 Refresh relevant UI sections (contacts, messages)

### 10. Testing
10.1 Write unit tests for `IgnoredUsersService`
10.2 Write unit tests for ignore check middleware
10.3 Write integration tests for API endpoints
10.4 Write E2E tests for ignore/un-ignore flows
10.5 Verify existing tests still pass

### 11. Documentation
11.1 Update API documentation (if separate docs exist)
11.2 Add comments to new code
11.3 Verify type safety across frontend/backend

---

## Dependencies

- Task Group 1 must complete before 2
- Task Group 2 must complete before 3, 4, 5
- Task Group 3 must complete before 6
- Task Group 6 must complete before 7, 8, 9
- Task Groups 1-5 are backend only
- Task Groups 6-9 are frontend only
- Task Group 10 can run in parallel with 6-9

## Estimated Order of Work

1. Backend data model (Group 1)
2. Backend service (Group 2)
3. Backend API + middleware (Groups 3-4)
4. Backend real-time (Group 5)
5. Frontend API client (Group 6)
6. Frontend state management (Group 8)
7. Frontend real-time (Group 9)
8. Frontend UI components (Group 7)
9. Testing (Group 10)
10. Documentation (Group 11)
