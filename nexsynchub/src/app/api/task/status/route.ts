import { after, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { createAuditLog } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";
import { sendTaskAssignmentNotification } from "@/lib/task-assignment-notification";

import Task from "@/models/Task";
import Membership from "@/models/Membership";
import Message from "@/models/Message";
import Channel from "@/models/Channel";

const TASK_STATUSES = ["todo", "in-progress", "done"] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];

type TaskStatusRequest = {
  taskId?: string;
  status?: TaskStatus;
  assignee?: string | null;
};

type MembershipRecord = {
  role?: string;
};

type PopulatedMembershipUser = {
  user?: {
    _id: unknown;
    username?: string;
    email?: string;
  } | null;
};

function isTaskStatus(status: unknown): status is TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus);
}

function formatStatusLabel(status: TaskStatus) {
  if (status === "in-progress") return "In Progress";
  if (status === "done") return "DONE";
  return "TODO";
}

async function emitSocketEvent(body: unknown) {
  if (!process.env.SOCKET_SERVER_URL) return;

  await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const session = await requireAuth();
    const { taskId, status, assignee } =
      (await req.json()) as TaskStatusRequest;

    if (!taskId || (!status && assignee === undefined)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (status && !isTaskStatus(status)) {
      return NextResponse.json(
        { error: "Invalid task status" },
        { status: 400 }
      );
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const membership = await Membership.findOne({
      user: session.user.id,
      workspace: task.workspace,
    })
      .select("role")
      .lean<MembershipRecord | null>();

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const userId = session.user.id;
    const oldStatus = task.status as TaskStatus;
    const oldAssignee = task.assignee?.toString() || "";
    const normalizedRole = String(membership.role || "").toLowerCase();
    const isCreator = task.createdBy?.toString() === userId;
    const isAssignee = task.assignee?.toString() === userId;
    const isAdmin = normalizedRole === "admin" || normalizedRole === "owner";

    if (!isCreator && !isAssignee && !isAdmin) {
      return NextResponse.json(
        { error: "You are not allowed to update this task" },
        { status: 403 }
      );
    }

    if (status) {
      task.set("status", status);
    }

    if (assignee !== undefined) {
      task.set("assignee", assignee || null);
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignee", "username")
      .populate("createdBy", "username")
      .lean();

    const workspaceId = String(task.workspace);
    const taskObjectId = String(task._id);
    const taskTitle = task.title;
    const taskChannelId = task.channel ? String(task.channel) : null;
    const actorName = session.user.username || "Someone";
    const assigneeChanged =
      assignee !== undefined && oldAssignee !== String(assignee || "");
    const statusChanged =
      Boolean(status) && status !== oldStatus;

    after(async () => {
      try {
        await emitSocketEvent({
          channelId: workspaceId,
          event: "task_updated",
          data: populatedTask,
        });
      } catch (error) {
        console.error("Task update socket failed:", error);
      }

      if (assigneeChanged) {
        try {
          await createAuditLog({
            workspaceId,
            actorId: session.user.id,
            action: assignee ? "task_assigned" : "task_unassigned",
            targetType: "task",
            targetId: taskObjectId,
            metadata: {
              taskTitle,
              oldAssignee,
              newAssignee: assignee || null,
            },
          });
        } catch (error) {
          console.error("Task assignment audit failed:", error);
        }
      }

      let assigneeUser: PopulatedMembershipUser["user"] = null;

      if (assignee) {
        try {
          const targetMembership = await Membership.findOne({
            user: assignee,
            workspace: workspaceId,
          })
            .populate("user", "username email")
            .lean<PopulatedMembershipUser | null>();

          assigneeUser = targetMembership?.user || null;
        } catch (error) {
          console.error("Task assignee lookup failed:", error);
        }
      }

      if (assignee && assigneeUser?.email && assigneeUser.username) {
        try {
          await sendTaskAssignmentNotification({
            assignee: {
              _id: String(assigneeUser._id),
              username: assigneeUser.username,
              email: assigneeUser.email,
            },
            assignedBy: actorName,
            taskId: taskObjectId,
            taskTitle,
            workspaceId,
          });
        } catch (error) {
          console.error("Task assignment notification failed:", error);
        }
      }

      let actionText = "";

      if (statusChanged && status) {
        actionText = `${actorName} marked "${taskTitle}" as ${formatStatusLabel(
          status
        )}`;
      }

      if (assigneeChanged && assignee && assigneeUser?.username) {
        actionText = `${actorName} assigned "${taskTitle}" to ${assigneeUser.username}`;
      }

      if (assigneeChanged && !assignee) {
        actionText = `${actorName} unassigned "${taskTitle}"`;
      }

      if (!actionText || !taskChannelId) {
        return;
      }

      try {
        const channel = await Channel.findOne({
          _id: taskChannelId,
          workspace: workspaceId,
        })
          .select("_id")
          .lean<{ _id: unknown } | null>();

        if (!channel) return;

        const systemMessage = await Message.create({
          content: actionText,
          channel: channel._id,
          sender: session.user.id,
          type: "task_activity",
          task: taskObjectId,
        });

        const populatedMessage = await Message.findById(systemMessage._id)
          .populate("sender", "username")
          .populate("task", "title")
          .lean();

        await Promise.allSettled([
          emitSocketEvent({
            channelId: String(channel._id),
            message: populatedMessage,
          }),
          emitSocketEvent({
            channelId: taskObjectId,
            event: "task_activity",
            data: populatedMessage,
          }),
          emitSocketEvent({
            channelId: workspaceId,
            event: "workspace_activity",
            data: populatedMessage,
          }),
        ]);
      } catch (error) {
        console.error("Task activity message failed:", error);
      }
    });

    return NextResponse.json({
      success: true,
      task: populatedTask,
    });
  } catch (error) {
    console.error("UPDATE TASK STATUS ERROR:", error);
    return handleApiError(error);
  }
}
