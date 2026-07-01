# NexSyncHub - Real-Time Chat & Channels

This document details the chat model structure, channel properties, dynamic attachments, message reactions, and WebSocket communication workflows.

## 1. Channels Architecture

Workspace communication is divided into channels managed by the `Channel` collection (`models/Channel.ts`):
*   **Properties**: Contains the channel `name`, reference to its `workspace`, `type` (enum: `TEXT`, `VOICE`), and an `isSystem` indicator.
*   **Unique Index**: Channel names must be unique within a single workspace (`{ name: 1, workspace: 1 }` is set to unique).
*   **System Channels**: General channels generated automatically during workspace initialization (e.g. general text channels).

## 2. Message Structures

Messages are stored in the `Message` collection (`models/Message.ts`):
*   **Properties**: References `channel`, `sender` (User), `type` (enum: `user`, `system`, `task_activity`), and an optional `task` reference.
*   **Constraints**: A pre-validation Mongoose hook enforces that messages cannot be empty (i.e. they must have either text `content` or at least one file `attachment`) unless the type is set to `system`.
*   **Attachments**: The `attachments` field stores metadata objects including:
    *   `key`: AWS S3 object key.
    *   `type`: `image`, `video`, or `file`.
    *   `name`: Original file name.
    *   `size`: File size in bytes.
*   **Reactions**: The `reactions` array stores reaction objects mapping an `emoji` to the list of `User` IDs who selected it.

## 3. Real-Time Chat Pipeline

1. **Client Join**: When a user selects a channel in the UI, the client emits `join_channel` with the `channelId` to the Socket.IO server.
2. **Typing Indicators**:
    *   When the user starts typing, the client emits `typing_start`. The Socket.IO server broadcasts `user_typing` back to other clients in the same channel room.
    *   When the user stops or ceases typing, `typing_stop` is emitted and broadcasted as `user_stop_typing`.
3. **Message Delivery**:
    *   The client posts the message via the Next.js API endpoint `/api/message/send`.
    *   The Next.js API validates inputs, saves the message record to MongoDB, and then calls the internal Socket.IO `/emit` API endpoint.
    *   The Socket.IO server broadcasts the `receive_message` payload to the channel's room, updating all online clients.
4. **Reactions**: Done in `/api/message/react`. The backend records the emoji selection in Mongoose and triggers a socket broadcast update so the reaction immediately renders on other clients' screens.
