"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function NotificationBell() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unread, setUnread] = useState(0);
    const [open, setOpen] = useState(false);

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
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!session?.user?.id) return;

        // 🔥 join personal room
        socket.emit("join_channel", session.user.id);

    }, [session]);

    useEffect(() => {
        socket.on("new_notification", (notif) => {
            console.log("🔔 NEW NOTIFICATION:", notif);

            // 🔥 update UI instantly
            setNotifications((prev: any) => [notif, ...prev]);
            setUnread((prev) => prev + 1);
        });

        return () => {
            socket.off("new_notification");
        };
    }, []);

    const handleClick = async (n: any) => {
        try {
            // 🔥 mark as read
            await fetch("/api/notification/read", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: n._id }),
            });

            // 🔥 update UI instantly
            setNotifications((prev: any) =>
                prev.map((p: any) =>
                    p._id === n._id ? { ...p, isRead: true } : p
                )
            );

            setUnread((prev) => Math.max(prev - 1, 0));

            // 🔥 redirect
            router.push(n.link);

            // 🔥 close dropdown
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

            // 🔥 update UI instantly
            setNotifications((prev: any) =>
                prev.map((n: any) => ({ ...n, isRead: true }))
            );

            setUnread(0);
        } catch (err) {
            console.error("Mark all error:", err);
        }
    };

    return (
        <div className="relative">
            {/* 🔔 ICON */}
            <button onClick={() => setOpen(!open)} className="relative">
                🔔

                {unread > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">
                        {unread}
                    </span>
                )}
            </button>

            {/* 📩 DROPDOWN */}
            {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow rounded p-3 space-y-2 z-50">
                    {notifications.length === 0 && (
                        <p className="text-sm text-gray-500">No notifications</p>
                    )}

                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Notifications</p>

                        {unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {notifications.map((n: any) => (
                        <div
                            key={n._id}
                            onClick={() => handleClick(n)}
                            className={`text-sm p-2 rounded ${n.isRead ? "bg-gray-100" : "bg-blue-50"
                                }`}
                        >
                            {n.content}
                        </div>
                    ))}

                    <button
                        onClick={() => router.push("/dashboard/notifications")}
                        className="w-full text-sm text-center text-indigo-600 hover:underline mt-2"
                    >
                        View all notifications
                    </button>
                </div>
            )}
        </div>
    );
}