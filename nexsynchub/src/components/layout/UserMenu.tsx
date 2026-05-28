"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { logout } from "@/lib/client/logout";
import {
  ChevronUp, User, Settings, Bell, LogOut,
  LayoutDashboard, Check, ExternalLink, Inbox,
  BellOff, Zap, Crown, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#03060F",
  surface:  "rgba(8,16,40,0.85)",
  border:   "rgba(99,140,255,0.10)",
  borderHi: "rgba(99,140,255,0.22)",
  accent:   "#3D7BFF",
  accentLo: "rgba(61,123,255,0.12)",
  accentMd: "rgba(61,123,255,0.25)",
  emerald:  "#10B981",
  rose:     "#FF4D6D",
  text:     "#E2E8F8",
  muted:    "#4A5578",
};

/* ─── format time ────────────────────────────────────────────────────────── */
function formatTime(dateString: string): string {
  const date   = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const m      = Math.floor(diffMs / 60_000);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return date.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

/* ─── NotificationItem ───────────────────────────────────────────────────── */
function NotificationItem({ notification, index, onClick }: {
  notification: any; index: number; onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  const isUnread = !notification.isRead;

  return (
    <motion.button
      initial={{ opacity:0, x:-8 }}
      animate={{ opacity:1, x:0 }}
      transition={{ duration:0.22, delay:index*0.04 }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative w-full text-left transition-all duration-150"
      style={{
        borderBottom: `1px solid ${T.border}`,
        background: hov ? "rgba(61,123,255,0.05)" : "transparent",
      }}
    >
      {/* unread left stripe */}
      {isUnread && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full"
          style={{ background:`linear-gradient(180deg,${T.accent},#7C3AED)` }} />
      )}

      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* icon */}
        <div className="mt-0.5 w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: isUnread ? T.accentLo : "rgba(255,255,255,0.04)",
            border: `1px solid ${isUnread ? T.accentMd : T.border}`,
          }}>
          <Zap size={12} style={{ color: isUnread ? T.accent : T.muted }} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug"
            style={{ color: isUnread ? T.text : T.muted, fontWeight: isUnread ? 500 : 400, fontFamily:"'DM Sans',sans-serif" }}>
            {notification.content}
          </p>
          {notification.link && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ color:T.accent }}>
              <ExternalLink size={9} /> View details
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[10px]" style={{ color:T.muted }}>{formatTime(notification.createdAt)}</span>
          {isUnread && (
            <span className="h-2 w-2 rounded-full"
              style={{ background:T.accent, boxShadow:`0 0 8px ${T.accent}` }} />
          )}
        </div>
      </div>
    </motion.button>
  );
}

/* ─── MenuItem ───────────────────────────────────────────────────────────── */
function MenuItem({ icon:Icon, label, onClick, danger }: {
  icon: React.ElementType; label: string; onClick: () => void; danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const color = danger ? T.rose : hov ? T.text : T.muted;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
      style={{
        background: hov ? (danger ? "rgba(255,77,109,0.08)" : "rgba(255,255,255,0.04)") : "transparent",
        color,
      }}
    >
      <Icon size={15} />
      <span className="text-sm" style={{ fontFamily:"'DM Sans',sans-serif" }}>{label}</span>
    </button>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────────────────── */
export default function UserMenu() {
  const { data:session, status } = useSession();
  const router = useRouter();
  const [open, setOpen]                         = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications]       = useState<any[]>([]);
  const [unread, setUnread]                     = useState(0);
  const [mounted, setMounted]                   = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res  = await fetch("/api/notification/list");
      const data = await res.json();
      if (res.ok) { setNotifications(data.notifications); setUnread(data.unreadCount); }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { if (session?.user?.id) fetchNotifications(); }, [session, fetchNotifications]);

  useEffect(() => {
    if (!session?.user?.id) return;
    socket.emit("join_channel", session.user.id);
  }, [session]);

  useEffect(() => {
    const handler = (notification: any) => {
      setNotifications(prev => [notification, ...prev]);
      setUnread(prev => prev + 1);
    };
    socket.on("new_notification", handler);
    return () => { socket.off("new_notification", handler); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false); setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    try {
      await fetch("/api/notification/read", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ notificationId:notification._id }),
      });
      setNotifications(prev => prev.map(n => n._id===notification._id ? { ...n, isRead:true } : n));
      setUnread(prev => Math.max(prev-1, 0));
      router.push(notification.link);
      setNotificationsOpen(false);
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notification/read-all", { method:"PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead:true })));
      setUnread(0);
    } catch (err) { console.error(err); }
  };

  if (!mounted || status==="loading") return null;

  const username   = (session?.user as any)?.username || session?.user?.name || "User";
  const email      = session?.user?.email || "";
  const avatarUrl  = session?.user?.image || (session?.user as any)?.avatar;
  const userRole   = (session?.user as any)?.role || "user";
  const initials   = username.slice(0, 2).toUpperCase();

  /* role badge */
  const roleBadge = userRole === "super_admin"
    ? { icon:Crown,  color:"#F59E0B", lo:"rgba(245,158,11,0.12)", label:"Super Admin" }
    : userRole === "admin"
    ? { icon:Shield, color:T.accent,  lo:T.accentLo,              label:"Admin" }
    : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');`}</style>

      {/* ── TRIGGER ── */}
      <div className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl transition-all duration-200 cursor-pointer"
        style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${T.border}` }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(61,123,255,0.06)"; (e.currentTarget as HTMLDivElement).style.borderColor=T.accentMd; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.03)"; (e.currentTarget as HTMLDivElement).style.borderColor=T.border; }}
      >
        {/* avatar button */}
        <button type="button" onClick={() => { setOpen(!open); setNotificationsOpen(false); }}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username}
                className="w-8 h-8 rounded-xl object-cover"
                style={{ border:`1.5px solid ${T.accentMd}` }} />
            ) : (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                style={{ background:T.accentLo, border:`1.5px solid ${T.accentMd}`, color:T.accent, fontFamily:"'Sora',sans-serif" }}>
                {initials}
              </div>
            )}
            {/* online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background:T.emerald, borderColor:T.bg, boxShadow:`0 0 6px ${T.emerald}` }} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate" style={{ color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
              {username}
            </p>
            <p className="text-[10px] truncate" style={{ color:T.muted }}>Online</p>
          </div>
        </button>

        {/* notifications bell */}
        <button type="button"
          onClick={e => { e.stopPropagation(); setNotificationsOpen(p=>!p); setOpen(false); }}
          className="relative w-7 h-7 shrink-0 flex items-center justify-center rounded-xl transition-all duration-150"
          style={{ background:T.accentLo, border:`1px solid ${T.accentMd}`, color:T.accent }}
          aria-label="Notifications">
          <Bell size={13} />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0, opacity:0 }}
                className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white border-2"
                style={{ background:T.rose, borderColor:T.bg, boxShadow:`0 0 8px ${T.rose}60` }}>
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* chevron */}
        <ChevronUp
          onClick={() => { setOpen(!open); setNotificationsOpen(false); }}
          size={14} className={`shrink-0 transition-transform duration-200 ${open ? "" : "rotate-180"}`}
          style={{ color:T.muted }} />
      </div>

      {/* ── DROPDOWNS ── */}
      <AnimatePresence>

        {/* NOTIFICATIONS */}
        {notificationsOpen && (
          <motion.div
            initial={{ opacity:0, y:8, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1, transition:{ duration:0.22, ease:[0.22,1,0.36,1] } }}
            exit={{ opacity:0, y:6, scale:0.97, transition:{ duration:0.15 } }}
            className="absolute bottom-full left-0 right-0 mb-2.5 overflow-hidden rounded-2xl z-[9999]"
            style={{ background:T.surface, border:`1px solid ${T.borderHi}`, backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", boxShadow:`0 -16px 48px -8px rgba(0,0,0,0.5)` }}
          >
            {/* top accent */}
            <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.accent},#7C3AED,transparent)` }} />

            {/* header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:`1px solid ${T.border}` }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 flex items-center justify-center rounded-xl"
                  style={{ background:T.accentLo, border:`1px solid ${T.accentMd}` }}>
                  <Bell size={12} style={{ color:T.accent }} />
                </div>
                <h3 className="text-[13px] font-bold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>
                  Notifications
                </h3>
                {unread > 0 && (
                  <span className="rounded-lg px-1.5 py-0.5 text-[9px] font-black"
                    style={{ background:T.accentLo, color:T.accent, border:`1px solid ${T.accentMd}` }}>
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button onClick={markAllAsRead}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={{ background:T.emerald+"18", border:`1px solid ${T.emerald}30`, color:T.emerald }}>
                  <Check size={10} strokeWidth={2.5} /> Read all
                </button>
              )}
            </div>

            {/* list */}
            <div className="max-h-72 overflow-y-auto"
              style={{ scrollbarWidth:"thin", scrollbarColor:`${T.accentMd} transparent` }}>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
                  <div className="w-11 h-11 flex items-center justify-center rounded-2xl"
                    style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}` }}>
                    <BellOff size={18} style={{ color:T.muted }} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-white" style={{ fontFamily:"'Sora',sans-serif" }}>All quiet</p>
                    <p className="text-[11px]" style={{ color:T.muted }}>No notifications yet</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {notifications.map((n, i) => (
                    <NotificationItem key={n._id} notification={n} index={i}
                      onClick={() => handleNotificationClick(n)} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* footer */}
            <div className="p-2.5" style={{ borderTop:`1px solid ${T.border}` }}>
              <button
                onClick={() => { router.push("/dashboard/notifications"); setNotificationsOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{ background:T.accentLo, border:`1px solid ${T.accentMd}`, color:T.accent }}>
                <Inbox size={11} /> View all notifications
              </button>
            </div>
          </motion.div>
        )}

        {/* USER MENU */}
        {open && (
          <motion.div
            initial={{ opacity:0, y:8, scale:0.97 }}
            animate={{ opacity:1, y:0, scale:1, transition:{ duration:0.22, ease:[0.22,1,0.36,1] } }}
            exit={{ opacity:0, y:6, scale:0.97, transition:{ duration:0.15 } }}
            className="absolute bottom-full left-0 right-0 mb-2.5 overflow-hidden rounded-2xl z-[9999]"
            style={{ background:T.surface, border:`1px solid ${T.borderHi}`, backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)", boxShadow:`0 -16px 48px -8px rgba(0,0,0,0.5)` }}
          >
            {/* top accent */}
            <div className="h-0.5" style={{ background:`linear-gradient(90deg,${T.accent},#7C3AED,transparent)` }} />

            {/* user header */}
            <div className="px-4 py-4" style={{ borderBottom:`1px solid ${T.border}` }}>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="w-10 h-10 rounded-2xl object-cover shrink-0"
                    style={{ border:`1.5px solid ${T.accentMd}` }} />
                ) : (
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background:T.accentLo, border:`1.5px solid ${T.accentMd}`, color:T.accent, fontFamily:"'Sora',sans-serif" }}>
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate" style={{ fontFamily:"'Sora',sans-serif" }}>{username}</p>
                    {roleBadge && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold uppercase"
                        style={{ background:roleBadge.lo, color:roleBadge.color, border:`1px solid ${roleBadge.color}30` }}>
                        <roleBadge.icon size={8} /> {roleBadge.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color:T.muted }}>{email}</p>
                </div>
              </div>
            </div>

            {/* menu items */}
            <div className="p-2 space-y-0.5">
              <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => { router.push("/dashboard"); setOpen(false); }} />
              <MenuItem icon={User}            label="Profile"   onClick={() => { router.push("/dashboard/profile"); setOpen(false); }} />
              <MenuItem icon={Settings}        label="Settings"  onClick={() => { router.push("/dashboard/settings"); setOpen(false); }} />
              <MenuItem icon={Bell}            label="Notifications" onClick={() => { router.push("/dashboard/notifications"); setOpen(false); }} />
            </div>

            <div className="mx-3 mb-1 h-px" style={{ background:T.border }} />

            <div className="p-2 pt-1">
              <MenuItem icon={LogOut} label="Log out" onClick={() => logout()} danger />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}