# NexSyncHub - Database Schema & Connections

This document details the MongoDB connection setup, Mongoose schemas, and relational links mapping out the database architecture.

## 1. Database Connection

*   **Setup**: Configured in `src/lib/db.ts` using Mongoose.
*   **Connection Caching**: Implements connection pooling and caches the active database driver connection in development to avoid hitting connection limits during hot-reloads.
*   **URI Source**: Derived from `process.env.MONGODB_URI`.

## 2. Core Schemas & Relational Maps

```
  +--------------+          +-------------------+          +-------------+
  |     User     |<-------->|    Membership     |<-------->|  Workspace  |
  +--------------+          +-------------------+          +-------------+
         ^                                                        |
         |                                                        v
         |                                                 +-------------+
         +-------------------------------------------------|   Invite    |
         |                                                 +-------------+
         v                                                        |
  +--------------+                                                v
  |   Message    |<----------------------------------------+-------------+
  +--------------+                                         |   Channel   |
         |                                                 +-------------+
         v                                                        |
  +--------------+                                                v
  |     Task     |<----------------------------------------+-------------+
  +--------------+
         |
         v
  +--------------+
  | TaskComment  |
  +--------------+
```

### 1. User (`models/User.ts`)
*   `email`: String (lowercase, unique, indexed).
*   `password`: Hashed string.
*   `role`: Enum (`user`, `admin`, `super_admin`).
*   `username`: String (unique, lowercase, sparse).
*   Profile fields: `displayName`, `bio`, `avatar` S3 key.
*   Security flags: `isEmailVerified`, `isBanned`, `banReason`, `banExpiresAt`, `bannedBy` (ObjectId ref User).

### 2. Workspace (`models/Workspace.ts`)
*   `name`: String.
*   `avatar`, `description`: String.
*   `owner`: ObjectId ref User.
*   Stripe Integration: `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, billing period start/end, and plan parameters (`free`, `pro`, `business`).

### 3. Membership (`models/Membership.ts`)
*   `user`: ObjectId ref User.
*   `workspace`: ObjectId ref Workspace.
*   `role`: Enum (`OWNER`, `ADMIN`, `MEMBER`).
*   *Compound Index*: `{ user: 1, workspace: 1 }` set to unique.

### 4. Invite (`models/Invite.ts`)
*   `workspace`: ObjectId ref Workspace.
*   `token`: Cryptographic string.
*   `role`: Enum (`ADMIN`, `MEMBER`).
*   `expiresAt`: Date.
*   `createdBy`: ObjectId ref User.

### 5. Channel (`models/Channel.ts`)
*   `name`: String.
*   `workspace`: ObjectId ref Workspace.
*   `type`: Enum (`TEXT`, `VOICE`).
*   `isSystem`: Boolean (general channels created on setup).
*   *Compound Index*: `{ name: 1, workspace: 1 }` set to unique.

### 6. Message (`models/Message.ts`)
*   `content`: String.
*   `attachments`: Array of sub-documents (AWS S3 keys, types, sizes).
*   `reactions`: Array of reactions mapping an emoji string to an array of User ObjectIds.
*   `channel`: ObjectId ref Channel (indexed with `createdAt` for fast fetching).
*   `sender`: ObjectId ref User.
*   `type`: Enum (`user`, `system`, `task_activity`).
*   `task`: ObjectId ref Task (for tasks generated from chat).

### 7. Task (`models/Task.ts`)
*   `title`, `description`: String.
*   `workspace`: ObjectId ref Workspace.
*   `channel`: ObjectId ref Channel.
*   `createdBy`: ObjectId ref User.
*   `assignee`: ObjectId ref User.
*   `status`: Enum (`todo`, `in-progress`, `done`).
*   `priority`: Enum (`low`, `medium`, `high`).
*   `linkedMessage`: ObjectId ref Message.

### 8. TaskComment (`models/TaskComment.ts`)
*   `content`: String.
*   `task`: ObjectId ref Task.
*   `sender`: ObjectId ref User.

### 9. Notification (`models/Notification.ts`)
*   `user`: ObjectId ref User.
*   `type`: Enum (`task_assigned`, `task_comment`, `task_updated`, `mention`, `system`).
*   `content`, `link`: String.
*   `isRead`: Boolean.

### 10. PlatformSettings (`models/PlatformSettings.ts`)
*   `allowRegistrations`: Boolean.
*   `maintenanceMode`: Boolean.
*   `globalAnnouncement`: String.

### 11. SecurityLog (`models/SecurityLog.ts`)
*   `user`: ObjectId ref User.
*   `action`: String (e.g. `auth_login_failed`).
*   `ip`, `userAgent`: String.
*   `metadata`: Mixed object.
