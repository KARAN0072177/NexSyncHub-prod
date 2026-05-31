import { createNotification } from "@/lib/notification";

type SupportTicketNotificationKind =
  | "follow_up"
  | "status_update";

type SupportTicketNotificationParams = {
  userId: string;
  ticketId: string;
  subject: string;
  kind: SupportTicketNotificationKind;
  status?: string;
};

type NotificationPayload = {
  _id: unknown;
  type: string;
  content: string;
  link: string;
  workspace?: unknown;
  isRead: boolean;
  createdAt: Date;
};

function formatStatusLabel(status?: string) {
  if (!status) {
    return "updated";
  }

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSupportNotificationContent({
  subject,
  kind,
  status,
}: Omit<SupportTicketNotificationParams, "userId" | "ticketId">) {
  if (kind === "follow_up") {
    return `Support requested more information for "${subject}".`;
  }

  return `Your support ticket "${subject}" was marked ${formatStatusLabel(status)}.`;
}

async function emitNotificationToUser(
  userId: string,
  notification: NotificationPayload
) {
  const socketUrl =
    process.env.SOCKET_SERVER_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL;

  if (!socketUrl) {
    return;
  }

  try {
    await fetch(`${socketUrl}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: userId,
        event: "new_notification",
        data: {
          _id: notification._id,
          type: notification.type,
          content: notification.content,
          link: notification.link,
          workspace: notification.workspace,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      }),
    });
  } catch (error) {
    console.error(
      "SUPPORT NOTIFICATION REALTIME ERROR:",
      error
    );
  }
}

export async function createSupportTicketNotification({
  userId,
  ticketId,
  subject,
  kind,
  status,
}: SupportTicketNotificationParams) {
  const notification = await createNotification({
    user: userId,
    type: "system",
    content: getSupportNotificationContent({
      subject,
      kind,
      status,
    }),
    link: `/dashboard/tickets?ticketId=${ticketId}`,
  });

  if (notification) {
    await emitNotificationToUser(userId, notification);
  }

  return notification;
}
