"use client";

type WorkspacePresenceProps = {
  members: any[];
};

export default function WorkspacePresence({
  members,
}: WorkspacePresenceProps) {
  return (
    <div className="relative">
      <button
        className="text-xs text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-full border border-gray-700/50"
      >
        {members.length} members
      </button>
    </div>
  );
}