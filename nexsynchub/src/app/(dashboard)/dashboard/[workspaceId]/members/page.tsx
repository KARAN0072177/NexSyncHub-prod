import MembersClient from "./MembersClient";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params; // ✅ FIX

  return <MembersClient workspaceId={workspaceId} />;
}