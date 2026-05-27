import {
  createNotification,
} from "@/lib/notification";

import {
  sendTaskAssignedEmail,
} from "@/lib/email";

interface Props {

  assignee: {

    _id: string;

    username: string;

    email: string;

  };

  assignedBy:
    string | null | undefined;

  taskId: string;

  taskTitle: string;

  workspaceId: string;

}

export async function
sendTaskAssignmentNotification({

  assignee,

  assignedBy,

  taskId,

  taskTitle,

  workspaceId,

}: Props) {

  // 🔥 Safe fallback
  const actorName =
    assignedBy || "Someone";

  // ===============================
  // DATABASE NOTIFICATION
  // ===============================
  await createNotification({

    user:
      assignee._id,

    type:
      "task_assigned",

    content:
      `${actorName} assigned you "${taskTitle}"`,

    link:
      `/workspace/${workspaceId}/tasks?taskId=${taskId}`,

    task:
      taskId,

    workspace:
      workspaceId,

  });

  // ===============================
  // REALTIME SOCKET NOTIFICATION
  // ===============================
  try {

    await fetch(

      `${process.env.SOCKET_SERVER_URL}/emit`,

      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json",

        },

        body:
          JSON.stringify({

            channelId:
              assignee._id.toString(),

            event:
              "new_notification",

            data: {

              _id:
                new Date().toISOString(),

              content:
                `${actorName} assigned you "${taskTitle}"`,

              link:
                `/workspace/${workspaceId}/tasks?taskId=${taskId}`,

              isRead:
                false,

              createdAt:
                new Date(),

            },

          }),

      }

    );

  } catch (err) {

    console.error(
      "TASK SOCKET NOTIFICATION ERROR:",
      err
    );

  }

  // ===============================
  // EMAIL
  // ===============================
  try {

    await sendTaskAssignedEmail({

      to:
        assignee.email,

      username:
        assignee.username,

      taskTitle,

      assignedBy:
        actorName,

      link:
        `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/tasks?taskId=${taskId}`,

    });

  } catch (err) {

    console.error(
      "TASK ASSIGN EMAIL ERROR:",
      err
    );

  }

}