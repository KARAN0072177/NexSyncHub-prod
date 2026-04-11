"use client";

import { useEffect, useState } from "react";
import ChatArea from "./ChatArea";

export default function WorkspaceClient({
  workspaceId,
  role,
}: {
  workspaceId: string;
  role: string;
}) {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      const res = await fetch(
        `/api/channel/list?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (res.ok) {
        setChannels(data.channels);
        if (data.channels.length > 0) {
          setSelectedChannel(data.channels[0]); // default
        }
      }
    };

    fetchChannels();
  }, [workspaceId]);

  return (
    <div className="flex h-[80vh] border rounded overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 border-r p-3 space-y-2">
        <h2 className="font-semibold mb-2">Channels</h2>

        {channels.map((ch) => (
          <div
            key={ch._id}
            onClick={() => setSelectedChannel(ch)}
            className={`p-2 rounded cursor-pointer ${
              selectedChannel?._id === ch._id
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
          >
            # {ch.name}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <ChatArea channel={selectedChannel} />
        ) : (
          <div className="p-4">Select a channel</div>
        )}
      </div>
    </div>
  );
}