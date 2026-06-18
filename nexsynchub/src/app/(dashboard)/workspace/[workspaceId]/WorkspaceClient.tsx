"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Hash, Loader2 } from "lucide-react";

import ChatArea from "./ChatArea";

type WorkspaceChannel = {
  _id: string;
  name?: string;
  workspace?: string;
  isSystem?: boolean;
};

type ChannelListResponse = {
  channels?: WorkspaceChannel[];
};

export default function WorkspaceClient({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [channels, setChannels] = useState<WorkspaceChannel[]>([]);
  const [selectedChannel, setSelectedChannel] =
    useState<WorkspaceChannel | null>(null);
  const searchParams = useSearchParams();
  const queryChannelId = searchParams.get("channel");

  useEffect(() => {
    let cancelled = false;

    const fetchChannels = async () => {
      const res = await fetch(`/api/channel/list?workspaceId=${workspaceId}`);
      const data = (await res.json()) as ChannelListResponse;

      if (!res.ok || cancelled) return;

      const nextChannels = data.channels || [];

      setChannels(nextChannels);

      if (nextChannels.length > 0) {
        const found = nextChannels.find(
          (channel) => channel._id === queryChannelId
        );

        setSelectedChannel(found || nextChannels[0]);
      }
    };

    fetchChannels();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, queryChannelId]);

  if (!selectedChannel) {
    return (
      <div className="flex items-center justify-center h-full">
        {channels.length === 0 ? (
          <div className="text-center p-8 rounded-2xl bg-gray-900/50 border border-gray-800">
            <Hash className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No channels found</p>
          </div>
        ) : (
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        )}
      </div>
    );
  }

  return <ChatArea channel={selectedChannel} />;
}
