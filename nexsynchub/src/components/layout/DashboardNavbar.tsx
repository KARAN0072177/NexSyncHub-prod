"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell, Check, ExternalLink, Inbox,
  BellOff, Zap, LayoutDashboard, Compass, User,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import NavbarUserMenu from "../dashboard/NavbarUserMenu";

/* ─── Design Tokens ── Electric Blue / Deep Navy ─────────────────────────── */
const T = {
  bg: "#03060F",
  navBg: "rgba(3,6,15,0.88)",
  surface: "rgba(8,14,32,0.92)",
  surfaceMid: "rgba(10,18,40,0.95)",
  panel: "rgba(6,11,26,0.90)",

  border: "rgba(61,123,255,0.10)",
  borderMid: "rgba(61,123,255,0.18)",
  borderHi: "rgba(61,123,255,0.32)",
  borderGlow: "rgba(61,123,255,0.55)",

  blue: "#3D7BFF",
  blueBright: "#6699FF",
  blueDim: "rgba(61,123,255,0.55)",
  blueLo: "rgba(61,123,255,0.08)",
  blueMid: "rgba(61,123,255,0.16)",
  blueGlow: "rgba(61,123,255,0.28)",

  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.10)",

  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.10)",
  emeraldMid: "rgba(16,185,129,0.20)",

  rose: "#F43F5E",
  roseLo: "rgba(244,63,94,0.10)",

  text: "#E2E8F8",
  textDim: "#5A6E9A",
  textMuted: "#283450",
  textGhost: "#0F1628",
} as const;

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Nav Link ───────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { href: "/dashboard",         label: "Dashboard", Icon: LayoutDashboard },
  { href: "/dashboard/browse",  label: "Browse",    Icon: Compass          },
  { href: "/dashboard/pricing", label: "Pricing",   Icon: CreditCard       },
  { href: "/dashboard/profile", label: "Profile",   Icon: User             },
] as const;

function NavLink({ href, label, Icon, active }: { href: string; label: string; Icon: any; active: boolean }) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200 group"
      style={{
        color: active ? T.blueBright : T.textDim,
        background: active ? T.blueLo : "transparent",
        border: active ? `1px solid ${T.borderMid}` : "1px solid transparent",
      }}
    >
      <Icon size={14} style={{ color: active ? T.blue : T.textMuted }} />
      {label}
      {active && (
        <motion.div
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: `1px solid ${T.borderHi}`, boxShadow: `0 0 12px ${T.blueGlow}` }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
    </Link>
  );
}

/* ─── Notification Item ──────────────────────────────────────────────────── */
function NotifItem({ n, onClick, idx }: { n: any; onClick: () => void; idx: number }) {
  return (
    <motion.button
      key={n._id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="w-full text-left transition-all duration-150 group relative"
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      {/* Unread left stripe */}
      {!n.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
          style={{ background: `linear-gradient(180deg, ${T.blue}, ${T.violet})` }} />
      )}

      <div
        className="px-4 py-3.5 flex items-start gap-3 transition-colors duration-150"
        style={{
          background: !n.isRead ? `rgba(61,123,255,0.04)` : "transparent",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.blueLo; }}
        onMouseLeave={e => { e.currentTarget.style.background = !n.isRead ? "rgba(61,123,255,0.04)" : "transparent"; }}
      >
        {/* Icon circle */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{
            background: !n.isRead ? T.blueMid : T.textGhost,
            border: `1px solid ${!n.isRead ? T.borderMid : T.border}`,
          }}>
          <Zap size={13} style={{ color: !n.isRead ? T.blue : T.textMuted }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-snug"
            style={{ color: !n.isRead ? T.text : "rgba(226,232,248,0.6)", fontWeight: !n.isRead ? 500 : 400 }}>
            {n.content}
          </p>
          {n.link && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold"
              style={{ color: T.blue, fontFamily: "'JetBrains Mono',monospace" }}>
              <ExternalLink size={9} />
              View details
            </div>
          )}
        </div>

        {/* Time + unread dot */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[10px]" style={{ color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
            {formatTime(n.createdAt)}
          </span>
          {!n.isRead && (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full"
              style={{ background: T.blue, boxShadow: `0 0 6px ${T.blue}` }}
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Bell Button ────────────────────────────────────────────────────────── */
function BellButton({ unread, onClick, active }: { unread: number; onClick: () => void; active: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
      style={{
        background: active ? T.blueMid : T.blueLo,
        border: `1px solid ${active ? T.borderHi : T.borderMid}`,
        boxShadow: active ? `0 0 16px ${T.blueGlow}` : "none",
      }}
    >
      <motion.div
        animate={unread > 0 ? { rotate: [0, -12, 12, -8, 8, 0] } : { rotate: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Bell size={16} style={{ color: active ? T.blueBright : T.textDim }} />
      </motion.div>

      <AnimatePresence>
        {unread > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            className="absolute -top-1 -right-1 min-w-[17px] h-[17px] flex items-center justify-center rounded-full px-1 text-[9px] font-black"
            style={{
              background: `linear-gradient(135deg, ${T.rose}, #CC1F3A)`,
              color: "#fff",
              boxShadow: `0 2px 8px rgba(244,63,94,0.5)`,
              fontFamily: "'JetBrains Mono',monospace",
              border: `1.5px solid ${T.bg}`,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ─── Notification Dropdown ──────────────────────────────────────────────── */
function NotifDropdown({
  notifications, unread, onItemClick, onMarkAll, onViewAll,
}: {
  notifications: any[];
  unread: number;
  onItemClick: (n: any) => void;
  onMarkAll: () => void;
  onViewAll: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: -6 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-[calc(100%+10px)] w-[380px] rounded-3xl overflow-hidden shadow-2xl z-[100]"
      style={{
        background: T.surfaceMid,
        border: `1px solid ${T.borderMid}`,
        backdropFilter: "blur(40px) saturate(180%)",
        boxShadow: `0 24px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px ${T.border}, inset 0 1px 0 rgba(61,123,255,0.08)`,
      }}
    >
      {/* Top glow line */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${T.blue}60, ${T.violet}40, transparent)` }} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: T.blueMid, border: `1px solid ${T.borderMid}` }}>
            <Bell size={12} style={{ color: T.blue }} />
          </div>
          <h3 className="text-[13px] font-bold text-white"
            style={{ fontFamily: "'Geist Mono',monospace", letterSpacing: "-0.01em" }}>
            Notifications
          </h3>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
              style={{
                background: T.blueMid,
                color: T.blue,
                border: `1px solid ${T.borderMid}`,
                fontFamily: "'JetBrains Mono',monospace",
              }}
            >
              {unread} new
            </motion.span>
          )}
        </div>

        {unread > 0 && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onMarkAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            style={{
              background: T.emeraldLo,
              border: `1px solid ${T.emeraldMid}`,
              color: T.emerald,
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            <Check size={10} strokeWidth={2.5} />
            Mark all read
          </motion.button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: T.blueLo, border: `1px solid ${T.border}` }}>
              <BellOff size={20} style={{ color: T.textMuted }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">All quiet</p>
              <p className="text-[11px]" style={{ color: T.textMuted }}>No notifications yet</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifications.map((n, idx) => (
              <NotifItem key={n._id} n={n} onClick={() => onItemClick(n)} idx={idx} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5" style={{ borderTop: `1px solid ${T.border}` }}>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewAll}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all"
          style={{
            background: T.blueLo,
            border: `1px solid ${T.borderMid}`,
            color: T.blueDim,
            fontFamily: "'JetBrains Mono',monospace",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.blueBright; (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderHi; (e.currentTarget as HTMLButtonElement).style.background = T.blueMid; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.blueDim; (e.currentTarget as HTMLButtonElement).style.borderColor = T.borderMid; (e.currentTarget as HTMLButtonElement).style.background = T.blueLo; }}
        >
          <Inbox size={12} />
          View all notifications
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── MAIN NAVBAR ────────────────────────────────────────────────────────── */
export default function DashboardNavbar() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notification/list");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        setUnread(data.unreadCount);
      }
    } catch (e) { console.error(e); }
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
    const handler = (notif: any) => {
      setNotifications(prev => [notif, ...prev]);
      setUnread(prev => prev + 1);
    };
    socket.on("new_notification", handler);
    return () => { socket.off("new_notification", handler); };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClick = useCallback(async (n: any) => {
    try {
      await fetch("/api/notification/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n._id }),
      });
      setNotifications(prev => prev.map(p => p._id === n._id ? { ...p, isRead: true } : p));
      setUnread(prev => Math.max(prev - 1, 0));
      router.push(n.link);
      setOpen(false);
    } catch (e) { console.error(e); }
  }, [router]);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notification/read-all", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e) { console.error(e); }
  }, []);

  return (
    <>
      {/* Global style injected once — no hydration issue since it's static */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
      `}</style>

      <header
        className="sticky top-0 z-50"
        style={{
          background: T.navBg,
          borderBottom: `1px solid ${T.border}`,
          backdropFilter: "blur(24px) saturate(180%)",
          boxShadow: `0 1px 0 ${T.border}, 0 4px 24px -8px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top accent line */}
        <div className="h-px w-full absolute top-0 left-0 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${T.blue}50 30%, ${T.violet}30 70%, transparent 100%)` }} />

        <div className="h-[58px] px-4 sm:px-6 flex items-center justify-between max-w-screen-2xl mx-auto">

          {/* ── LEFT: Logo + Nav ── */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/navlogo.png"
                alt="NexSyncHub"
                className="h-8 w-auto object-contain"
              />
            </Link>

            {/* Divider */}
            <div className="w-px h-5 hidden md:block" style={{ background: T.border }} />

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(({ href, label, Icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  Icon={Icon}
                  active={pathname === href}
                />
              ))}
            </nav>
          </div>

          {/* ── RIGHT: Bell + User ── */}
          <div className="relative flex items-center gap-2.5" ref={dropdownRef}>

            <BellButton unread={unread} onClick={() => setOpen(o => !o)} active={open} />

            <AnimatePresence>
              {open && (
                <NotifDropdown
                  notifications={notifications}
                  unread={unread}
                  onItemClick={handleClick}
                  onMarkAll={markAllAsRead}
                  onViewAll={() => { router.push("/dashboard/notifications"); setOpen(false); }}
                />
              )}
            </AnimatePresence>

            {/* Vertical divider */}
            <div className="w-px h-6 mx-0.5" style={{ background: T.border }} />

            {session?.user && (
              <NavbarUserMenu
                user={{
                  id: session.user.id,
                  name: session.user.name,
                  email: session.user.email,
                  image: session.user.image,
                  username: (session.user as any).username,
                  avatar: (session.user as any).avatar,
                }}
              />
            )}
          </div>
        </div>
      </header>
    </>
  );
}
