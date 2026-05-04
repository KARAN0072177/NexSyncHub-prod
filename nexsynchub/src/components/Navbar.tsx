// components/Navbar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Check,
  ExternalLink,
  Inbox,
  BellOff,
  Menu,
  X,
  LayoutDashboard,
  Info,
  MessageSquare,
  LogOut,
  User,
  ChevronDown,
  Settings,
} from "lucide-react";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // ---------- Notification Bell State / Logic (unchanged) ----------
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [openBell, setOpenBell] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch notifications (unchanged)
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

  // Socket join (unchanged)
  useEffect(() => {
    if (!session?.user?.id) return;
    socket.emit("join_channel", session.user.id);
  }, [session]);

  // Socket listener (unchanged)
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

  // Close dropdown on outside click (unchanged logic, adjusted for combined refs)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(e.target as Node)
      ) {
        setOpenBell(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notification click handler (unchanged)
  const handleBellClick = async (n: any) => {
    try {
      await fetch("/api/notification/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n._id }),
      });
      setNotifications((prev: any) =>
        prev.map((p: any) => (p._id === n._id ? { ...p, isRead: true } : p))
      );
      setUnread((prev) => Math.max(prev - 1, 0));
      router.push(n.link);
      setOpenBell(false);
    } catch (err) {
      console.error("Notification click error:", err);
    }
  };

  // Mark all read (unchanged)
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notification/read-all", { method: "PATCH" });
      setNotifications((prev: any) => prev.map((n: any) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (err) {
      console.error("Mark all error:", err);
    }
  };

  // Format time (unchanged)
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

  // ---------- Navbar UI State ----------
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutsideUser = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideUser);
    return () => document.removeEventListener("mousedown", handleClickOutsideUser);
  }, []);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "About", href: "/about", icon: Info },
    { label: "Contact Us", href: "/contact", icon: MessageSquare },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-gray-900/70 backdrop-blur-lg border-b border-gray-800/50 shadow-lg shadow-black/10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 flex-shrink-0 text-white font-bold text-lg tracking-tight"
          >
            <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
              <LayoutDashboard size={18} className="text-indigo-400" />
            </div>
            <span className="hidden sm:inline">NexSyncHub</span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${isActive(link.href)
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
              >
                <link.icon size={16} />
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notification Bell (replaces old icon) */}
            <div className="relative">
              <button
                ref={bellButtonRef}
                onClick={() => setOpenBell(!openBell)}
                className="relative p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-all"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center
                    bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg shadow-red-500/30 animate-pulse">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {/* Dropdown (unchanged) */}
              {openBell && (
                <div ref={dropdownRef} className="absolute right-0 mt-2 w-96 max-h-[70vh] bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                    <h3 className="font-semibold text-white text-sm">Notifications</h3>
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
                  <div className="overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <BellOff className="w-10 h-10 text-gray-600 mb-3" />
                        <p className="text-sm text-gray-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n: any) => (
                        <button
                          key={n._id}
                          onClick={() => handleBellClick(n)}
                          className={`w-full text-left p-4 border-b border-gray-800/30 transition-colors
                            ${n.isRead
                              ? "bg-transparent hover:bg-gray-800/30"
                              : "bg-indigo-500/5 border-l-2 border-l-indigo-500 hover:bg-indigo-500/10"
                            }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm flex-1 ${n.isRead ? "text-gray-300" : "text-white font-medium"}`}>
                              {n.content}
                            </p>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] text-gray-500">{formatTime(n.createdAt)}</span>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
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
                  <div className="p-3 border-t border-gray-800/50">
                    <button
                      onClick={() => {
                        router.push("/dashboard/notifications");
                        setOpenBell(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-gray-400
                        hover:text-gray-200 hover:bg-gray-800/50 rounded-xl transition-colors"
                    >
                      <Inbox size={14} />
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu (Desktop) */}
            {session ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800/50 text-gray-300 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
                    <User size={14} className="text-indigo-300" />
                  </div>
                  <span className="text-sm truncate max-w-[120px]">
                    {session.user?.username || "User"}
                  </span>
                  <ChevronDown size={14} className="text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
                    <div className="p-3 border-b border-gray-800/50">
                      <p className="text-sm font-medium text-white truncate">
                        {session.user?.username || "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          router.push("/dashboard/settings");
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                      >
                        <Settings size={14} />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: "/login" });
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-lg shadow-indigo-600/20"
              >
                Sign in
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-all"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800/50 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  router.push(link.href);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive(link.href)
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
              >
                <link.icon size={18} />
                {link.label}
              </button>
            ))}
            <div className="border-t border-gray-800/50 pt-2 mt-2">
              {session ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-300 flex items-center gap-2">
                    <User size={16} className="text-indigo-400" />
                    {session.user?.username || "User"}
                  </div>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/login" });
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    router.push("/login");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white transition-all"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}