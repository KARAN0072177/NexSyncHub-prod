// WorkspaceClient.tsx
"use client";

import { useEffect, useState } from "react";
import ChatArea from "./ChatArea";
import { useRouter, usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Hash,
  Plus,
  Users,
  CheckSquare,
  Settings,
  ChevronDown,
  X,
  Loader2,
  Globe,
} from "lucide-react";

export default function WorkspaceClient({
  workspaceId,
  role,
}: {
  workspaceId: string;
  role: string;
}) {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const searchParams = useSearchParams();
  const queryChannelId = searchParams.get("channel");

  const router = useRouter();
  const pathname = usePathname();

  const isMembersPage = pathname.includes("/members");
  const isTasksPage = pathname.includes("/tasks");

  useEffect(() => {
    const fetchChannels = async () => {
      const res = await fetch(`/api/channel/list?workspaceId=${workspaceId}`);
      const data = await res.json();

      if (res.ok) {
        setChannels(data.channels);
        if (data.channels.length > 0) {
          const found = data.channels.find((ch: any) => ch._id === queryChannelId);
          setSelectedChannel(found || data.channels[0]);
        }
      }
    };

    fetchChannels();
  }, [workspaceId, queryChannelId]);

  const createChannel = async () => {
    if (!channelName.trim()) return;
    setIsCreating(true);

    const res = await fetch("/api/channel/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: channelName,
        workspaceId,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setChannels((prev) => [...prev, data.channel]);
      setChannelName("");
      setShowModal(false);
    } else {
      alert(data.error);
    }
    setIsCreating(false);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-800/50 bg-gray-900/30 backdrop-blur-sm flex flex-col">
        {/* Workspace Header */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-gray-200 truncate text-lg tracking-tight">
              Workspace
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push("/dashboard/browse")}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                title="Browse workspaces"
              >
                <Globe size={18} />
              </button>
              <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200">
                <Settings size={18} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            {role === "admin" ? "Admin" : "Member"}
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Channels
              </h2>
              <button
                onClick={() => setShowModal(true)}
                className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
              {channels.length === 0 ? (
                <p className="text-xs text-gray-600 px-2 py-3 italic">
                  No channels yet
                </p>
              ) : (
                channels.map((ch) => {
                  const isActive =
                    selectedChannel?._id === ch._id && !isMembersPage && !isTasksPage;
                  return (
                    <button
                      key={ch._id}
                      onClick={() => {
                        setSelectedChannel(ch);
                        router.push(`/dashboard/${workspaceId}`);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                        ${isActive
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                          : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                        }`}
                    >
                      <Hash size={14} className="flex-shrink-0" />
                      <span className="truncate">{ch.name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Workspace Navigation */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Workspace
            </h2>
            <div className="space-y-0.5">
              {/* Tasks */}
              <button
                onClick={() => router.push(`/dashboard/${workspaceId}/tasks`)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                  ${isTasksPage
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
              >
                <CheckSquare size={14} className="flex-shrink-0" />
                <span>Tasks</span>
              </button>

              {/* Members */}
              <button
                onClick={() => router.push(`/dashboard/${workspaceId}/members`)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                  ${isMembersPage
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
              >
                <Users size={14} className="flex-shrink-0" />
                <span>Members</span>
              </button>

              {/* Activity */}

              <button
                onClick={() =>
                  router.push(`/dashboard/${workspaceId}/activity`)
                }
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
                ${isMembersPage
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
              >
                <Settings size={14} className="flex-shrink-0" />
                <span>Activity</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Footer */}
        <div className="p-3 border-t border-gray-800/50">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-800/30">
            <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-300">U</span>
            </div>
            <span className="text-sm text-gray-300 flex-1 truncate">User</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {isMembersPage || isTasksPage ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : selectedChannel ? (
          <ChatArea channel={selectedChannel} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
              <Hash className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Select a channel to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-400" />
                Create Channel
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Channel Name
                </label>
                <input
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. general"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createChannel();
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                    text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500/50 
                    focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 
                  transition-colors border border-gray-700 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createChannel}
                disabled={isCreating || !channelName.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 
                  disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-600/20 
                  flex items-center gap-2 text-sm font-medium"
              >
                {isCreating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Create Channel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}