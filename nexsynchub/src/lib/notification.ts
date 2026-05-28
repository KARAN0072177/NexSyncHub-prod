import Notification from "@/models/Notification";

export const createNotification = async ({
  user,
  type,
  content,
  link,
  task,
  workspace,
}: any) => {
  try {
    return await Notification.create({
      user,
      type,
      content,
      link,
      task,
      workspace,
    });
  } catch (err) {
    console.error("Notification error:", err);
    return null;
  }
};
