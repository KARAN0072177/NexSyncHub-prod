# NexSyncHub - AI Capabilities

This document highlights the AI-driven features integrated across user workspaces and administration panels.

## 1. Automated Explicit Media Moderation

To ensure workspace safety, NexSyncHub implements real-time image scanning on uploads:
*   **Provider**: Powered by AWS Rekognition (`src/lib/rekognition.ts`).
*   **Scanning Flow**:
    1.  When a user uploads an image file (chat attachments, workspace logos, profile avatars), the server streams the file buffer to the AWS Rekognition API.
    2.  Calls `DetectModerationLabels` to scan for explicit, adult, or suggestive content.
    3.  If unsafe labels are found, the upload is immediately blocked/quarantined.
    4.  An entry is generated in the `UnsafeMediaLog` database collection, and a real-time event alert is broadcasted to connected platform administrators.

## 2. AI-Powered Task Description Enhancements

*   **Endpoint**: `/api/ai/enhance-task`.
*   **Provider**: OpenAI API (`src/lib/openai.ts`).
*   **Workflow**:
    *   Users can write a brief, shorthand note or draft title for a task.
    *   Clicking the "Enhance Description" button sends a prompt to the OpenAI `gpt-4o` (or preferred model) endpoint.
    *   The model returns a detailed, well-formatted Markdown template outline including objectives, tasks checklist, and deliverable summaries, which is automatically saved back to the database.

## 3. Administrative Support Insights & Summaries

Admins have access to multiple AI tools inside the administration panel to manage customer relationships efficiently:
*   **Support Ticket Enhancer**: `/api/admin/support/ai-summary` translates long support ticket descriptions and threaded customer chats into a concise summary of the issue.
*   **Reply Suggestions**: `/api/admin/support/ai-enhance` generates draft response suggestions using context from the ticket history and platform policy rules.
*   **AI Moderation Lab**: `/api/admin/ai-moderation-lab` lets admins test Rekognition confidence parameters and inspect logs.
*   **Platform Advisor**: `/api/admin/ai-platform-advisor` provides AI-generated suggestions regarding resource usage, server loads, active workspace growth, and optimization insights based on platform database statistics.
