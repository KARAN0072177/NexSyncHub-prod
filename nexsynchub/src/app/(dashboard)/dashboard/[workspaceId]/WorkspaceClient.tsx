"use client";

import { useEffect, useState } from "react";
import ChatArea from "./ChatArea";
import { useRouter, usePathname } from "next/navigation";

export default function WorkspaceClient({
  workspaceId,
  role,
}: {
  workspaceId: string;
  role: string;
}) {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchChannels = async () => {
      const res = await fetch(
        `/api/channel/list?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (res.ok) {
        setChannels(data.channels);
        if (data.channels.length > 0) {
          setSelectedChannel(data.channels[0]);
        }
      }
    };

    fetchChannels();
  }, [workspaceId]);

  const isMembersPage = pathname.includes("/members");

  const isTasksPage = pathname.includes("/tasks");

  return (
    <div className="flex h-[80vh] border rounded overflow-hidden">

      {/* Sidebar */}
      <div className="w-64 border-r p-3 space-y-4">

        {/* Channels Section */}
        <div>
          <h2 className="font-semibold mb-2">Channels</h2>

          {channels.map((ch) => (
            <div
              key={ch._id}
              onClick={() => {
                setSelectedChannel(ch);
                router.push(`/dashboard/${workspaceId}`);
              }}
              className={`p-2 rounded cursor-pointer ${selectedChannel?._id === ch._id && !isMembersPage
                ? "bg-gray-200"
                : "hover:bg-gray-100"
                }`}
            >
              # {ch.name}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t pt-3">

          {/* Members Section */}
          <h2 className="font-semibold mb-2">Workspace</h2>

          {/* ✅ TASKS */}
          <div
            onClick={() =>
              router.push(`/dashboard/${workspaceId}/tasks`)
            }
            className={`p-2 rounded cursor-pointer ${isTasksPage
              ? "bg-gray-200"
              : "hover:bg-gray-100"
              }`}
          >
            📋 Tasks
          </div>

          {/* 👥 MEMBERS */}

          <div
            onClick={() =>
              router.push(`/dashboard/${workspaceId}/members`)
            }
            className={`p-2 rounded cursor-pointer ${isMembersPage
              ? "bg-gray-200"
              : "hover:bg-gray-100"
              }`}
          >
            👥 Members
          </div>

        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">

        {/* If user is on members page → don't show chat */}
        {(isMembersPage || isTasksPage) ? (
          <div className="p-4 text-gray-500">
            Redirecting...
          </div>
        ) : selectedChannel ? (
          <ChatArea channel={selectedChannel} />
        ) : (
          <div className="p-4">Select a channel</div>
        )}
      </div>
    </div>
  );
}