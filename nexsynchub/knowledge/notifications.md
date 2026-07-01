# NexSyncHub - Notification System

This document outlines the notification architecture, real-time WebSocket messaging, and email notification integrations.

## 1. Notification Model & Storage

In-app notifications are defined in the `Notification` collection (`models/Notification.ts`):
*   **Target User**: The `user` field links the notification to the receiving User record.
*   **Notification Types**: Categorized under the `type` enum:
    *   `task_assigned`: Fired when a user is assigned a new task.
    *   `task_comment`: Fired when a comment is added to a task the user is assigned to.
    *   `task_updated`: Fired upon task updates.
    *   `mention`: Fired when a user is mentioned in chat.
    *   `system`: Platform-level announcements.
*   **Properties**:
    *   `content`: Human-readable text content.
    *   `link`: Deep link path (e.g. `/workspace/[workspaceId]/tasks?taskId=[taskId]`).
    *   `isRead`: Boolean indicating read status (default: false, indexed for query speed).
    *   References: Optional ObjectIds linking to associated `task` or `workspace` collections.

## 2. Real-Time WebSocket Notifications

1. **User Channel**: Every user's client connects and listens to a private WebSocket room named after their unique `userId`.
2. **Notification Emit**: When a notification is generated (e.g. in `src/lib/task-assignment-notification.ts`):
    *   It inserts the notification record in MongoDB.
    *   It fires a POST request to `/emit` on the Socket.IO server with the `channelId` set to the recipient's `userId` and the event set to `new_notification`.
    *   The Socket.IO server pushes the payload to the user's private room.
    *   The frontend client receives this event and increments the unread notification badge count in real-time.

## 3. Email Notifications (Resend API)

Alongside in-app notifications, the system sends transactional emails using the `Resend` provider:
*   **Task Assignment Emails**: Notifies the assignee via email, including the assigner's name, task title, and a link to view the task in the application.
*   **Support Ticket Notifications**: Alerts users when an admin replies to their support ticket (`src/lib/support-ticket-notifications.ts`).
*   **Email Verifications & OTPs**: Transactional security emails triggered during authentication flows.
*   **Platform Settings**: The system uses the custom `RESEND_FROM_EMAIL` environment variable as the sender's identity.
