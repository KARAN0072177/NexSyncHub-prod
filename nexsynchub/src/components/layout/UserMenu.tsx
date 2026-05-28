"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { logout } from "@/lib/client/logout";
import {
    ChevronUp,
    User,
    Settings,
    Bell,
    LogOut,
    LayoutDashboard,
    Check,
    ExternalLink,
    Inbox,
    BellOff,
    Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;

    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h`;

    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function NotificationItem({
    notification,
    index,
    onClick,
}: {
    notification: any;
    index: number;
    onClick: () => void;
}) {
    return (
        <motion.button
            key={notification._id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            onClick={onClick}
            className="relative w-full border-b border-white/5 text-left transition-colors hover:bg-white/5"
        >
            {!notification.isRead && (
                <div className="absolute bottom-0 left-0 top-0 w-0.5 rounded-r-full bg-blue-500" />
            )}

            <div className="flex items-start gap-3 px-4 py-3.5">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${notification.isRead
                    ? "border-white/5 bg-white/5"
                    : "border-blue-500/25 bg-blue-500/15"
                    }`}
                >
                    <Zap
                        size={13}
                        className={notification.isRead ? "text-gray-500" : "text-blue-400"}
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <p className={`text-[13px] leading-snug ${notification.isRead
                        ? "font-normal text-gray-400"
                        : "font-medium text-gray-100"
                        }`}
                    >
                        {notification.content}
                    </p>

                    {notification.link && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                            <ExternalLink size={9} />
                            View details
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-[10px] text-gray-500">
                        {formatTime(notification.createdAt)}
                    </span>

                    {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}
                </div>
            </div>
        </motion.button>
    );
}

export default function UserMenu() {

    const { data: session, status } = useSession();

    const router = useRouter();

    const [open, setOpen] = useState(false);

    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);

    const [unread, setUnread] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notification/list");
            const data = await res.json();

            if (res.ok) {
                setNotifications(data.notifications);
                setUnread(data.unreadCount);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        if (!session?.user?.id) return;

        fetchNotifications();
    }, [session, fetchNotifications]);

    useEffect(() => {
        if (!session?.user?.id) return;

        socket.emit("join_channel", session.user.id);
    }, [session]);

    useEffect(() => {
        const handler = (notification: any) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnread((prev) => prev + 1);
        };

        socket.on("new_notification", handler);

        return () => {
            socket.off("new_notification", handler);
        };
    }, []);

    // 🔥 Close on outside click
    useEffect(() => {

        const handleClickOutside = (e: MouseEvent) => {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setNotificationsOpen(false);
            }

        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);

    if (!mounted || status === "loading") {
        return null;
    }

    const username =
        session?.user?.username || session?.user?.name || "User";

    const email =
        session?.user?.email || "";

    const avatarUrl = 
        session?.user?.image || (session?.user as any)?.avatar;

    // 🔥 Initials avatar
    const initials = username
        .slice(0, 2)
        .toUpperCase();

    const handleNotificationClick = async (notification: any) => {
        try {
            await fetch("/api/notification/read", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    notificationId: notification._id,
                }),
            });

            setNotifications((prev) =>
                prev.map((item) =>
                    item._id === notification._id
                        ? { ...item, isRead: true }
                        : item
                )
            );
            setUnread((prev) => Math.max(prev - 1, 0));
            router.push(notification.link);
            setNotificationsOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notification/read-all", {
                method: "PATCH",
            });

            setNotifications((prev) =>
                prev.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );
            setUnread(0);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div
            className="relative"
            ref={dropdownRef}
        >

            {/* Trigger */}
            <div
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
        hover:bg-white/5 transition-colors cursor-pointer"
            >

                {/* Avatar */}
                <button
                    type="button"
                    onClick={() => {
                        setOpen(!open);
                        setNotificationsOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                    <div className="relative shrink-0">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={username} className="w-9 h-9 rounded-full object-cover border border-blue-500/30" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-semibold text-blue-400">
                                {initials}
                            </div>
                        )}

                        {/* Online dot */}
                        <span
                            className="absolute bottom-0 right-0
                w-3 h-3 rounded-full
                bg-emerald-500 border-2 border-[#030712]"
                        />
                    </div>

                    {/* User info */}
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                            {username}
                        </p>

                        <p className="text-xs text-gray-500 truncate">
                            Online
                        </p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setNotificationsOpen((prev) => !prev);
                        setOpen(false);
                    }}
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-gray-400 transition-colors hover:border-blue-500/35 hover:bg-blue-500/15 hover:text-blue-300"
                    aria-label="Notifications"
                >
                    <Bell size={15} />

                    <AnimatePresence>
                        {unread > 0 && (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -right-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-[#030712] bg-red-500 px-1 text-[9px] font-black text-white shadow-lg shadow-red-500/40"
                            >
                                {unread > 9 ? "9+" : unread}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                <ChevronUp
                    onClick={() => {
                        setOpen(!open);
                        setNotificationsOpen(false);
                    }}
                    size={16}
                    className={`shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""
                        }`}
                />

            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {notificationsOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 right-0 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-2xl backdrop-blur-[40px] z-[9999]"
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/15">
                                    <Bell size={12} className="text-blue-400" />
                                </div>

                                <h3 className="text-[13px] font-bold text-white">
                                    Notifications
                                </h3>

                                {unread > 0 && (
                                    <span className="rounded-md border border-blue-500/25 bg-blue-500/15 px-1.5 py-0.5 text-[9px] font-black text-blue-400">
                                        {unread} new
                                    </span>
                                )}
                            </div>

                            {unread > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-colors hover:bg-emerald-500/15"
                                >
                                    <Check size={10} strokeWidth={2.5} />
                                    Read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                                        <BellOff size={20} className="text-gray-500" />
                                    </div>

                                    <div>
                                        <p className="mb-1 text-sm font-semibold text-white">
                                            All quiet
                                        </p>
                                        <p className="text-[11px] text-gray-500">
                                            No notifications yet
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {notifications.map((notification, index) => (
                                        <NotificationItem
                                            key={notification._id}
                                            notification={notification}
                                            index={index}
                                            onClick={() => handleNotificationClick(notification)}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        <div className="border-t border-white/10 p-2.5">
                            <button
                                onClick={() => {
                                    router.push("/dashboard/notifications");
                                    setNotificationsOpen(false);
                                }}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 py-2.5 text-[11px] font-bold uppercase tracking-widest text-blue-400 transition-colors hover:border-blue-500/35 hover:bg-blue-500/15"
                            >
                                <Inbox size={12} />
                                View all notifications
                            </button>
                        </div>
                    </motion.div>
                )}

                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 right-0 mb-3 bg-[#0f172a]/95 backdrop-blur-[40px] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[9999]"
                    >

                    {/* Header */}
                    <div className="p-4 border-b border-white/10">

                        <div className="flex items-center gap-3">

                            {avatarUrl ? (
                                <img src={avatarUrl} alt={username} className="w-11 h-11 rounded-full object-cover border border-blue-500/30 shrink-0" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-semibold text-blue-400 shrink-0">
                                    {initials}
                                </div>
                            )}

                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">
                                    {username}
                                </p>

                                <p className="text-xs text-gray-500 truncate">
                                    {email}
                                </p>
                            </div>

                        </div>

                    </div>

                    {/* Menu */}
                    <div className="p-2">

                        <button
                            onClick={() => {
                                router.push("/dashboard");
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl hover:bg-white/5
              text-gray-300 transition-colors cursor-pointer"
                        >
                            <LayoutDashboard size={16} />
                            <span className="text-sm">
                                Dashboard
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                router.push("/dashboard/profile");
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl hover:bg-white/5
              text-gray-300 transition-colors cursor-pointer"
                        >
                            <User size={16} />
                            <span className="text-sm">
                                Profile
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                router.push("/dashboard/settings");
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl hover:bg-white/5
              text-gray-300 transition-colors cursor-pointer"
                        >
                            <Settings size={16} />
                            <span className="text-sm">
                                Settings
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                router.push("/dashboard/notifications");
                                setOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl hover:bg-white/5
              text-gray-300 transition-colors cursor-pointer"
                        >
                            <Bell size={16} />
                            <span className="text-sm">
                                Notifications
                            </span>
                        </button>

                        <div className="my-2 border-t border-white/5" />

                        <button
                            onClick={() =>
                                logout()
                            }
                            className="w-full flex items-center gap-3 px-3 py-2.5
              rounded-xl hover:bg-red-500/10
              text-red-400 transition-colors cursor-pointer"
                        >
                            <LogOut size={16} />
                            <span className="text-sm">
                                Logout
                            </span>
                        </button>

                    </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
