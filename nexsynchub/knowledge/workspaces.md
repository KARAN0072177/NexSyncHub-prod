# NexSyncHub - Workspaces, Members, & Permissions

This document describes the Role-Based Access Control (RBAC) structure, membership roles, and permission levels associated with workspaces in the NexSyncHub platform.

## 1. Workspace Structure

Workspaces (`models/Workspace.ts`) act as the boundary for teams, projects, and billing plans.
*   **Properties**: Contains the workspace `name`, `avatar` S3 key, optional `description`, the `owner` User reference, and privacy settings (`isPrivate`).
*   **Billing Link**: Stores billing fields such as the subscription `plan` (enum: `free`, `pro`, `business`), Stripe subscription identifier (`stripeSubscriptionId`), current period parameters, and cancel directives.
*   **Default State**: Newly created workspaces default to the `free` tier and are set as private by default.

## 2. Memberships & Roles

A user must have a membership to access a workspace. The connection is managed by the `Membership` collection (`models/Membership.ts`):
*   **Unique Index**: Ensures a user has a single membership record per workspace (`{ user: 1, workspace: 1 }` is unique).
*   **Membership Roles**:
    *   `OWNER`: The workspace creator. Has full platform powers including role changes, transferring ownership, deleting the workspace, and billing plan management.
    *   `ADMIN`: Can manage workspace projects, invite new users, remove lower-tier members, and edit channel configurations.
    *   `MEMBER`: Collaborative role. Can participate in chat channels, create and move tasks, and upload files.

## 3. Workspace Invitations

*   **Token Generation**: Generated using dynamic secure invite tokens. An `Invite` record (`models/Invite.ts`) maps the workspace to a unique secure token, sets the assignee `role` (Admin/Member), and defines the `expiresAt` expiration.
*   **Invite URLs**: Sent to prospective users. The URL matches the pattern `/invite?token=...` or `/invite/accept`.
*   **Acceptance Flow**: When a user accesses the endpoint:
    1.  The token is verified for existence and expiration.
    2.  The backend confirms if the user is already a member.
    3.  A new `Membership` record is inserted with the role specified in the invitation token.

## 4. Permissions Architecture

*   **Role-Based Access Control (RBAC)**: Enforces authorization boundaries at the API and layout levels using platform-wide and workspace-level roles.
*   **Helper Utilities**: Located in `src/lib/permissions.ts`.
*   **Workspace Admin Checks**: `isWorkspaceAdmin` checks if a user is the owner or an admin of the workspace.
*   **Workspace Owner Checks**: `isWorkspaceOwner` verifies if the user is the workspace owner.
*   **Platform Admins vs. Workspace Admins**: Platform administrators (`admin` or `super_admin` in `UserSchema.role`) have complete authority over all workspaces, billing statuses, and system configurations globally. Workspace-level admins are restricted solely to the workspace boundary.
*   **Access Guards**: API routes and server actions verify membership status by querying `Membership.findOne({ workspace: workspaceId, user: userId })` before serving any internal workspace records.

## 5. Role-Based Access Control (RBAC)

NexSyncHub implements a strict Role-Based Access Control (RBAC) mechanism to secure workspace boundaries and platform administration.

### Workspace-Level Roles:
*   **OWNER**: The workspace creator. Has full workspace access, including the ability to transfer ownership, delete the workspace, modify user roles, and upgrade or cancel billing subscription plans.
*   **ADMIN**: Can manage projects and channel settings, generate invite tokens, invite new members, and remove lower-tier workspace members.
*   **MEMBER**: Collaborative role. Can access chat channels, upload attachments, write task comments, and transition task statuses on the Kanban board.

### Platform-Level Roles:
*   **super_admin** / **admin**: Platform administrators defined globally in `UserSchema.role`. They bypass all workspace boundaries, possessing full administrative oversight over workspaces, user accounts, security logs, and global billing records.

### Permission Enforcement:
*   Enforced on the backend via helper utility methods `isWorkspaceAdmin(userId, workspaceId)` and `isWorkspaceOwner(userId, workspaceId)` located in `src/lib/permissions.ts`.
*   API routes query the `Membership` database collection (`Membership.findOne({ workspace: workspaceId, user: userId })`) to validate the user's role and block access to unauthorized actions (like modifying settings, deleting channels, or upgrading billing tiers).
