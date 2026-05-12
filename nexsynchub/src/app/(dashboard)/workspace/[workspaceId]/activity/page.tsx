import ActivityClient from "./ActivityClient";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return <ActivityClient workspaceId={workspaceId} />;
}