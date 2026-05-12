"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ExternalLink,
  Inbox,
  BellOff,
  LogOut,
} from "lucide-react";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function DashboardNavbar() {
  const { data: session } = useSession();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  const fetchNotifications = async () => {
    const res = await fetch("/api/notification/list");
    const data = await res.json();

    if (res.ok) {
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();
  }, [session]);

  // Join socket room
  useEffect(() => {
    if (!session?.user?.id) return;

    socket.emit("join_channel", session.user.id);
  }, [session]);

  // Real-time notifications
  useEffect(() => {
    const handler = (notif: any) => {
      setNotifications((prev: any) => [notif, ...prev]);
      setUnread((prev) => prev + 1);
    };

    socket.on("new_notification", handler);

    return () => {
      socket.off("new_notification", handler);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      // Disconnect socket
      socket.disconnect();

      // Destroy session
      await signOut({
        callbackUrl: "/login",
      });

    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  };

  const handleClick = async (n: any) => {
    try {
      await fetch("/api/notification/read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId: n._id,
        }),
      });

      setNotifications((prev: any) =>
        prev.map((p: any) =>
          p._id === n._id
            ? { ...p, isRead: true }
            : p
        )
      );

      setUnread((prev) => Math.max(prev - 1, 0));

      router.push(n.link);

      setOpen(false);

    } catch (err) {
      console.error("Notification click error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notification/read-all", {
        method: "PATCH",
      });

      setNotifications((prev: any) =>
        prev.map((n: any) => ({
          ...n,
          isRead: true,
        }))
      );

      setUnread(0);

    } catch (err) {
      console.error("Mark all error:", err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);

    const now = new Date();

    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";

    if (diffMins < 60) return `${diffMins}m`;

    const diffHrs = Math.floor(diffMins / 60);

    if (diffHrs < 24) return `${diffHrs}h`;

    return date.toLocaleDateString();
  };

  return (
    <div className="relative flex items-center gap-2" ref={dropdownRef}>

      {/* Notification Bell */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-all"
      >
        <Bell size={20} />

        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Logout Button */}
      {
        session ? (
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <LogOut size={14} />

            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            Login
          </button>
        )
      }

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-14 mt-2 w-96 max-h-[70vh] bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
            <h3 className="font-semibold text-white text-sm">
              Notifications
            </h3>

            {unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-96">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <BellOff className="w-10 h-10 text-gray-600 mb-3" />

                <p className="text-sm text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n: any) => (
                <button
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left p-4 border-b border-gray-800/30 transition-colors
                    ${n.isRead
                      ? "bg-transparent hover:bg-gray-800/30"
                      : "bg-indigo-500/5 border-l-2 border-l-indigo-500 hover:bg-indigo-500/10"
                    }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p
                      className={`text-sm flex-1 ${n.isRead
                        ? "text-gray-300"
                        : "text-white font-medium"
                        }`}
                    >
                      {n.content}
                    </p>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] text-gray-500">
                        {formatTime(n.createdAt)}
                      </span>

                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  </div>

                  {n.link && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-indigo-400">
                      <ExternalLink size={10} />
                      <span>View details</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800/50">
            <button
              onClick={() => {
                router.push("/dashboard/notifications");
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 rounded-xl transition-colors"
            >
              <Inbox size={14} />
              View all notifications
            </button>
          </div>

        </div>
      )}
    </div>
  );
}