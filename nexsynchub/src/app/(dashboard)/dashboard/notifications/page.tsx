import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import {
  Bell, CheckCheck, Clock, Inbox, Zap,
  ShieldOff, Hash, Users, MessageSquare, Settings,
} from "lucide-react";

/* ─── Design Tokens ── Electric Blue / Deep Navy (matches DashboardNavbar) ─ */
const T = {
  bg: "#03060F",
  surface: "rgba(8,14,32,0.82)",
  surfaceMid: "rgba(10,18,40,0.88)",
  surfaceHi: "rgba(13,22,50,0.92)",

  border: "rgba(61,123,255,0.08)",
  borderMid: "rgba(61,123,255,0.16)",
  borderHi: "rgba(61,123,255,0.28)",
  borderGlow: "rgba(61,123,255,0.50)",

  blue: "#3D7BFF",
  blueBright: "#6699FF",
  blueDim: "rgba(61,123,255,0.55)",
  blueLo: "rgba(61,123,255,0.07)",
  blueMid: "rgba(61,123,255,0.15)",
  blueGlow: "rgba(61,123,255,0.25)",

  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.10)",

  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.09)",
  emeraldMid: "rgba(16,185,129,0.18)",

  amber: "#F59E0B",
  amberLo: "rgba(245,158,11,0.09)",

  rose: "#F43F5E",
  roseLo: "rgba(244,63,94,0.09)",

  text: "#E2E8F8",
  textDim: "#5A6E9A",
  textMuted: "#283450",
  textGhost: "#0F1628",
} as const;

type DashboardNotification = {
  _id: string;
  content: string;
  action?: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* Derive a type/color hint from notification content */
function getNotifMeta(content: string, action: string = "") {
  const lower = (content + action).toLowerCase();
  if (lower.includes("support") || lower.includes("ticket"))
    return { color: T.amber,  bg: T.amberLo,   border: "rgba(245,158,11,0.20)", Icon: MessageSquare };
  if (lower.includes("channel") || lower.includes("#"))
    return { color: T.blue,    bg: T.blueLo,    border: T.borderMid, Icon: Hash         };
  if (lower.includes("member") || lower.includes("joined") || lower.includes("invite"))
    return { color: "#A78BFA", bg: T.violetLo,  border: "rgba(167,139,250,0.20)", Icon: Users };
  if (lower.includes("message") || lower.includes("mention"))
    return { color: T.blue,    bg: T.blueLo,    border: T.borderMid, Icon: MessageSquare };
  if (lower.includes("workspace"))
    return { color: T.emerald, bg: T.emeraldLo, border: T.emeraldMid, Icon: Settings    };
  return { color: T.blue, bg: T.blueLo, border: T.borderMid, Icon: Zap };
}

/* Group notifications by date label */
function groupByDay(notifications: DashboardNotification[]): { label: string; items: DashboardNotification[] }[] {
  const groups: Record<string, DashboardNotification[]> = {};
  const now = new Date();

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    const label =
      diffDays === 0 ? "Today" :
      diffDays === 1 ? "Yesterday" :
      diffDays < 7   ? d.toLocaleDateString("en-US", { weekday: "long" }) :
      d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

/* ─── MAIN PAGE (Server Component) ──────────────────────────────────────── */
export default async function NotificationsPage() {
  await connectDB();
  const session = await getServerSession(authOptions);

  /* ── Unauthorized ── */
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: T.bg }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;600;700&family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
          * { font-family: 'DM Sans', sans-serif; }
        `}</style>

        <div className="flex flex-col items-center gap-5 p-10 rounded-3xl text-center"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderMid}`,
            backdropFilter: "blur(24px)",
            boxShadow: `0 24px 60px -16px rgba(0,0,0,0.7)`,
          }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: T.roseLo, border: `1px solid rgba(244,63,94,0.22)` }}>
            <ShieldOff size={24} style={{ color: T.rose }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Syne',sans-serif" }}>
              Unauthorized
            </h2>
            <p className="text-sm" style={{ color: T.textDim }}>Please sign in to view your notifications.</p>
          </div>
        </div>
      </div>
    );
  }

  const rawNotifications = await Notification.find({ user: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  const notifications: DashboardNotification[] = rawNotifications.map((n) => ({
    ...n,
    _id: String(n._id),
    createdAt: new Date(n.createdAt),
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const groups = groupByDay(notifications);

  return (
    <div className="min-h-screen relative" style={{ background: T.bg, color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700;800&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        * { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(61,123,255,0.2); border-radius: 99px; }
      `}</style>

      {/* ── Atmospheric BG ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden>
        <div style={{ position:"absolute", top:-180, left:-100, width:650, height:650, borderRadius:"50%", background:"rgba(61,123,255,0.05)", filter:"blur(120px)" }} />
        <div style={{ position:"absolute", bottom:-120, right:-80, width:500, height:500, borderRadius:"50%", background:"rgba(124,58,237,0.04)", filter:"blur(100px)" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:`radial-gradient(circle, rgba(61,123,255,0.04) 1px, transparent 1px)`, backgroundSize:"40px 40px" }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${T.textGhost} 1px,transparent 1px),linear-gradient(90deg,${T.textGhost} 1px,transparent 1px)`, backgroundSize:"40px 40px", opacity:0.7 }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-24">

        {/* ── HEADER ── */}
        <div className="mb-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${T.blueBright}, transparent)` }} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]"
              style={{ color: T.blueBright, fontFamily: "'Geist Mono',monospace" }}>
              Inbox
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Icon */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-3xl" style={{ background: T.blueLo, filter: "blur(20px)" }} />
                <div className="relative w-16 h-16 rounded-3xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, rgba(61,123,255,0.18) 0%, rgba(61,123,255,0.05) 100%)`,
                    border: `1px solid ${T.borderHi}`,
                    boxShadow: `0 8px 32px ${T.blueGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  }}>
                  <Bell size={28} style={{ color: T.blueBright }} />
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-black text-white leading-none tracking-tight"
                  style={{ fontFamily: "'Syne',sans-serif" }}>
                  Notifications
                </h1>
                <p className="text-[15px] mt-2 font-medium" style={{ color: T.textDim }}>
                  Workspace activity &amp; updates
                </p>
              </div>
            </div>

            {/* Stats pills */}
            {notifications.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl transition-all"
                  style={{ background: T.surfaceMid, border: `1px solid ${T.borderMid}` }}>
                  <span className="text-xl font-black leading-none"
                    style={{ color: T.textDim, fontFamily: "'Geist Mono',monospace" }}>
                    {notifications.length}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5"
                    style={{ color: T.textMuted }}>
                    Total
                  </span>
                </div>
                {unreadCount > 0 && (
                  <div className="flex flex-col items-center px-5 py-2.5 rounded-2xl"
                    style={{ background: T.blueLo, border: `1px solid ${T.borderHi}`, boxShadow: `0 8px 24px ${T.blueGlow}` }}>
                    <span className="text-xl font-black leading-none"
                      style={{ color: T.blueBright, fontFamily: "'Geist Mono',monospace" }}>
                      {unreadCount}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5"
                      style={{ color: T.blueDim }}>
                      Unread
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── EMPTY STATE ── */}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-28 text-center rounded-3xl relative overflow-hidden"
            style={{
              background: T.surface,
              border: `1px solid ${T.borderMid}`,
              backdropFilter: "blur(24px)",
              boxShadow: `0 24px 60px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${T.blueLo}, transparent)` }} />
            <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${T.blue}40, transparent)` }} />

            <div className="relative z-10 w-[88px] h-[88px] rounded-[32px] flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.blueLo}, transparent)`, border: `1px solid ${T.borderHi}` }}>
              <Inbox size={36} style={{ color: T.blueDim }} />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <h3 className="text-2xl font-black text-white mb-3" style={{ fontFamily: "'Syne',sans-serif" }}>
                All quiet here
              </h3>
              <p className="text-[15px] max-w-sm" style={{ color: T.textDim }}>
                Notifications will appear when there&apos;s activity in your workspaces.
              </p>
            </div>
          </div>
        )}

        {/* ── GROUPED NOTIFICATION LIST ── */}
        {notifications.length > 0 && (
          <div className="space-y-8">
            {groups.map(({ label, items }) => (
              <section key={label}>
                {/* Day label */}
                <div className="flex items-center gap-4 mb-5">
                  <span className="text-[12px] font-black uppercase tracking-[0.2em]"
                    style={{ color: T.blueBright, fontFamily: "'Geist Mono',monospace" }}>
                    {label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: T.borderMid }} />
                  <span className="text-[11px] font-bold px-2 py-1 rounded-md"
                    style={{ background: T.blueLo, color: T.blueDim, fontFamily: "'Geist Mono',monospace" }}>
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="rounded-3xl overflow-hidden"
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.borderMid}`,
                    backdropFilter: "blur(24px)",
                    boxShadow: `0 8px 32px -8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}>
                  {/* Top accent */}
                  <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${T.blue}40, ${T.violet}25, transparent)` }} />

                  {items.map((n, idx) => {
                    const meta = getNotifMeta(n.content, n.action);
                    const isLast = idx === items.length - 1;

                    return (
                      <div
                        key={n._id}
                        className="relative flex items-start gap-5 px-6 py-5 transition-colors duration-150 group"
                        style={{
                          borderBottom: isLast ? "none" : `1px solid ${T.borderMid}`,
                          background: !n.isRead ? `rgba(61,123,255,0.03)` : "transparent",
                        }}
                      >
                        {/* Unread left stripe */}
                        {!n.isRead && (
                          <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full"
                            style={{ background: `linear-gradient(180deg, ${T.blue}, ${T.violet})` }} />
                        )}

                        {/* Icon */}
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{
                            background: !n.isRead ? meta.bg : T.surfaceHi,
                            border: `1px solid ${!n.isRead ? meta.border : T.border}`,
                            boxShadow: !n.isRead ? `0 4px 16px ${meta.color}25` : "none",
                          }}>
                          {n.isRead
                            ? <CheckCheck size={16} style={{ color: T.textMuted }} />
                            : <meta.Icon size={16} style={{ color: meta.color }} />
                          }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] leading-relaxed"
                            style={{
                              color: !n.isRead ? T.text : "rgba(226,232,248,0.7)",
                              fontWeight: !n.isRead ? 500 : 400,
                            }}>
                            {n.content}
                          </p>

                          {/* Meta row */}
                          <div className="flex items-center gap-3 mt-2.5">
                            <div className="flex items-center gap-1.5 text-[11px]"
                              style={{ color: T.textDim, fontFamily: "'Geist Mono',monospace" }}>
                              <Clock size={12} style={{ opacity: 0.7 }} />
                              <span title={formatFullDate(n.createdAt)}>
                                {formatRelativeTime(n.createdAt)}
                              </span>
                            </div>

                            {!n.isRead && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg"
                                style={{
                                  background: T.blueMid,
                                  color: T.blue,
                                  border: `1px solid ${T.borderHi}`,
                                  fontFamily: "'Geist Mono',monospace",
                                  boxShadow: `0 0 12px ${T.blueGlow}`
                                }}>
                                New
                              </span>
                            )}

                            {n.link && (
                              <Link
                                href={n.link}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold transition-opacity hover:opacity-80"
                                style={{ color: meta.color, fontFamily: "'Geist Mono',monospace" }}
                              >
                                View details
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Read indicator dot */}
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{
                              background: T.blue,
                              boxShadow: `0 0 6px ${T.blue}`,
                            }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* ── Footer summary ── */}
            <div className="flex items-center justify-center gap-4 pt-4">
              <div className="h-px flex-1" style={{ background: T.border }} />
              <span className="text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl"
                style={{
                  color: T.textMuted,
                  background: T.surfaceMid,
                  border: `1px solid ${T.border}`,
                  fontFamily: "'Geist Mono',monospace",
                }}>
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} total
              </span>
              <div className="h-px flex-1" style={{ background: T.border }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
