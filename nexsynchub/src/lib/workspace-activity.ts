import Channel from "@/models/Channel";
import Message from "@/models/Message";

export const WORKSPACE_ACTIVITY_CHANNEL_NAME = "workspace-activity";

export async function getWorkspaceActivityChannel(workspaceId: string) {
  return Channel.findOneAndUpdate(
    {
      workspace: workspaceId,
      name: WORKSPACE_ACTIVITY_CHANNEL_NAME,
    },
    {
      $setOnInsert: {
        workspace: workspaceId,
        name: WORKSPACE_ACTIVITY_CHANNEL_NAME,
        type: "TEXT",
        isSystem: true,
      },
      $set: {
        isSystem: true,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
}

export async function createWorkspaceActivityMessage({
  workspaceId,
  senderId,
  content,
}: {
  workspaceId: string;
  senderId: string;
  content: string;
}) {
  const channel = await getWorkspaceActivityChannel(workspaceId);

  const message = await Message.create({
    content,
    channel: channel._id,
    sender: senderId,
    type: "system",
  });

  const plainMessage = JSON.parse(JSON.stringify(message));

  try {
    await fetch(`${process.env.SOCKET_SERVER_URL}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelId: channel._id,
        message: plainMessage,
      }),
    });
  } catch (err) {
    console.error("WORKSPACE ACTIVITY SOCKET ERROR:", err);
  }

  return {
    channel,
    message,
  };
}
