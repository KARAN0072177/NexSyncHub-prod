import { Resend } from "resend";
import TaskAssignedEmail from "@/emails/TaskAssignedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendTaskAssignedEmail = async ({
  to,
  username,
  taskTitle,
  assignedBy,
  link,
}: any) => {
  await resend.emails.send({
    from: "NexSyncHub <noreply@karanart.com>",
    to,
    subject: `You were assigned: ${taskTitle}`,
    react: TaskAssignedEmail({
      username,
      taskTitle,
      assignedBy,
      link,
    }),
  });
};