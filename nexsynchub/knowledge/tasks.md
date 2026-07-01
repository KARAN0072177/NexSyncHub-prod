# NexSyncHub - Task Management & Workflows

This document outlines the Task schema, task comments, linked chat messages, drag-and-drop workflows, and state transitions.

## 1. Tasks Schema

Tasks are defined in the `Task` collection (`models/Task.ts`):
*   **Core Properties**: Includes task `title`, `description` string, and references to its parent `workspace` and `channel`.
*   **Roles & Ownership**: Links the creator (`createdBy`) and the current handler (`assignee`) to their User records.
*   **Workflow States**:
    *   `status`: Mapped to `todo`, `in-progress`, or `done` (defaults to `todo`).
    *   `priority`: Ranked as `low`, `medium`, or `high` (defaults to `medium`).
*   **Pre-validation checks**: An index and pre-validate hook enforce that a non-empty `title` is required for every task.
*   **Dates**: Contains optional `dueDate` and standard database timestamps.

## 2. Dynamic Workflows & State Transitions

*   **Kanban Board Integration**: The frontend manages tasks using a drag-and-drop board.
*   **Status Updates**: Dragging a task cards between columns updates its `status` via API calls to `/api/task/status`.
*   **Activity Logging**: Modifying a task's status, assignee, or priority generates a system notification and appends a `task_activity` message to the associated channel's log. This provides a chronological timeline of project changes directly in the workspace chat feed.

## 3. Creating Tasks from Chat (Linked Messages)

*   **Message Linking**: Users can convert a chat message into a task. The `linkedMessage` property stores the ID of the source message (`Message` collection).
*   **Traceability**: This link allows users to jump from the task detail view back to the original conversation where the task was discussed, preserving context.

## 4. Task Collaboration (Comments)

*   **Discussion Boards**: Inside the task details view, members can write comments.
*   **Comment Schema**: Managed by the `TaskComment` collection (`models/TaskComment.ts`), saving the text `content`, the `task` target ID, the author (`sender` User), and the post time.
*   **Notifications**: Adding comments fires automated in-app notifications (`task_comment`) to the task assignee and workspace owner.

## 5. Task Deep Linking

*   **URL Query Parameters**: Deep linking directly to tasks is supported via URL parameters. When linking to tasks (e.g., from an in-app notification or shared link), the URL is structured with a query parameter such as `/workspace/[workspaceId]?taskId=[taskId]`.
*   **Automatic Focus & Modal Display**: The client-side board logic (e.g., `TasksClient` or dashboard component) parses the `taskId` query parameter from the URL. If present, it automatically displays the task details `TaskModal` without requiring manual navigation, ensuring seamless deep linking support.
