// WorkspaceClient.tsx

"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import ChatArea from "./ChatArea";

import {
  Hash,
  Loader2,
} from "lucide-react";

export default function WorkspaceClient({
  workspaceId,
}: {
  workspaceId: string;
}) {

  const [channels, setChannels] =
    useState<any[]>([]);

  const [selectedChannel, setSelectedChannel] =
    useState<any>(null);

  const searchParams =
    useSearchParams();

  const queryChannelId =
    searchParams.get("channel");

  // 🔥 Fetch channels
  useEffect(() => {

    const fetchChannels =
      async () => {

        const res = await fetch(
          `/api/channel/list?workspaceId=${workspaceId}`
        );

        const data =
          await res.json();

        if (res.ok) {

          setChannels(data.channels);

          if (
            data.channels.length > 0
          ) {

            const found =
              data.channels.find(
                (ch: any) =>
                  ch._id ===
                  queryChannelId
              );

            setSelectedChannel(
              found ||
              data.channels[0]
            );

          }

        }

      };

    fetchChannels();

  }, [
    workspaceId,
    queryChannelId,
  ]);

  // 🔥 Mark channel as read
  useEffect(() => {

    if (!selectedChannel?._id)
      return;

    const markAsRead =
      async () => {

        try {

          await fetch(
            "/api/channel/mark-read",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                channelId:
                  selectedChannel._id,
              }),
            }
          );

          window.dispatchEvent(
            new CustomEvent(
              "channel-read",
              {
                detail: {
                  channelId:
                    selectedChannel._id,
                },
              }
            )
          );

        } catch (err) {

          console.error(
            "MARK READ ERROR:",
            err
          );

        }

      };

    // 🔥 Small delay
    const timer =
      setTimeout(
        markAsRead,
        500
      );

    return () =>
      clearTimeout(timer);

  }, [selectedChannel]);

  // 🔥 Loading
  if (!selectedChannel) {

    return (

      <div className="flex items-center justify-center h-full">

        {channels.length === 0 ? (

          <div
            className="text-center p-8 rounded-2xl bg-gray-900/50 border border-gray-800"
          >

            <Hash
              className="w-10 h-10 text-gray-600 mx-auto mb-3"
            />

            <p className="text-gray-400">
              No channels found
            </p>

          </div>

        ) : (

          <Loader2
            className="w-8 h-8 text-indigo-500 animate-spin"
          />

        )}

      </div>

    );

  }

  return (
    <ChatArea
      channel={selectedChannel}
    />
  );

}