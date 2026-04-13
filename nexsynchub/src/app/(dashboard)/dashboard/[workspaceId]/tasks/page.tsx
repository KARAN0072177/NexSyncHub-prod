import TasksClient from "./TasksClient";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params; // 🔥 FIX

  return <TasksClient workspaceId={workspaceId} />;
}