"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { logout } from "@/lib/client/logout";
import {
    LayoutDashboard,
    ScrollText,
    Users,
    Shield,
    Building2,
    ChevronUp,
    Home,
    LogOut,
    User,
    Settings,
    Key,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── design tokens ──────────────────────────────────────────────────────── */
const T = {
    accent:   "#3B82F6",
    accentLo: "rgba(59,130,246,0.12)",
    accentMd: "rgba(59,130,246,0.25)",
    surface:  "rgba(15,23,42,0.60)",
    border:   "rgba(255,255,255,0.06)",
    borderHi: "rgba(255,255,255,0.12)",
    text:     "#F8FAFC",
    muted:    "#94A3B8",
    red:      "#EF4444",
    redLo:    "rgba(239,68,68,0.10)",
};

function AdminUserMenu() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (status === "loading" || !session) return null;

    const username = session.user?.username || session.user?.name || "Admin";
    const email = session.user?.email || "";
    const role = (session.user as any)?.role === "super_admin" ? "Super Admin" : "Admin";
    const avatarUrl = session.user?.image || (session.user as any)?.avatar;
    const initials = username.slice(0, 2).toUpperCase();

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-left"
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
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#030712]" />
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-200 truncate">{username}</p>
                    <p className="text-xs font-medium truncate" style={{ color: T.accent }}>{role}</p>
                </div>
                <ChevronUp size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} style={{ color: T.muted }} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-full left-0 right-0 mb-3 rounded-2xl shadow-2xl overflow-hidden z-50"
                        style={{ background: "rgba(15,23,42,0.95)", border: `1px solid ${T.borderHi}`, backdropFilter: "blur(40px)" }}
                    >
                    {/* Header */}
                    <div className="p-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={username} className="w-11 h-11 rounded-full object-cover border border-blue-500/30 shrink-0" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-sm font-semibold text-blue-400 shrink-0">
                                    {initials}
                                </div>
                            )}
                            <div className="min-w-0 text-left">
                                <p className="text-sm font-semibold text-white truncate">
                                    {username}
                                </p>
                                <p className="text-xs truncate" style={{ color: T.muted }} title={email}>
                                    {email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="p-2">
                        <button
                            onClick={() => { router.push("/dashboard"); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                            style={{ color: T.text }}
                        >
                            <Home size={16} />
                            <span className="text-sm font-medium">Home</span>
                        </button>
                        
                        <div className="my-1 border-t" style={{ borderColor: T.border }} />
                        
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                            style={{ color: T.red }}
                            onMouseEnter={e => e.currentTarget.style.background = T.redLo}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                            <LogOut size={16} />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    const pathname = usePathname();

    const links = [
        {
            label: "Stats",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            label: "Audits",
            href: "/admin/audits",
            icon: ScrollText,
        },
        {
            label: "Users",
            href: "/admin/users",
            icon: Users,
        },
        {
            label: "Workspaces",
            href: "/admin/workspaces",
            icon: Building2,
        },
        {
            label: "Profile",
            href: "/admin/profile",
            icon: User,
        },
    ];

    const securityLinks = [
        {
            label: "Auth Logs",
            href: "/admin/auth-logs",
            icon: Key,
        },
        {
            label: "Moderation",
            href: "/admin/moderation",
            icon: Shield,
        },
    ];

    const renderLink = (link: { label: string; href: string; icon: React.ElementType }) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
            <Link
                key={link.href}
                href={link.href}
                className="relative w-full flex items-center gap-3 pl-3 pr-8 py-3 rounded-xl text-sm font-semibold transition-all group hover:bg-white/5 cursor-pointer"
                style={active ? { background: T.accentLo, color: T.accent, border: `1px solid ${T.accentMd}` } : { background: "transparent", color: T.muted, border: "1px solid transparent" }}
            >
                {active && (
                    <motion.div
                        layoutId="activeAdminSidebarLink"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{ background: T.accent, boxShadow: `0 0 10px ${T.accent}` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}

                <Icon size={18} className="opacity-70 group-hover:opacity-100 transition-opacity" />

                <span className="transition-colors group-hover:text-white" style={active ? { color: T.text } : {}}>
                    {link.label}
                </span>
            </Link>
        );
    };

    return (
        <div className="h-screen overflow-hidden flex text-white" style={{ background: "linear-gradient(135deg, #030712 0%, #080C17 100%)", fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
                ::-webkit-scrollbar { width:4px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
            `}</style>

            {/* ambient orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
                <div style={{ position:"absolute", top:-100, left:-80, width:420, height:420, borderRadius:"50%", background:"rgba(59,130,246,0.12)", filter:"blur(100px)" }} />
                <div style={{ position:"absolute", bottom:-60, right:-40, width:320, height:320, borderRadius:"50%", background:"rgba(14,165,233,0.08)", filter:"blur(100px)" }} />
            </div>

            {/* Sidebar */}
            <aside 
                className="w-[280px] flex-shrink-0 flex flex-col relative z-20"
                style={{
                    background: "rgba(3,7,18,0.65)",
                    borderRight: `1px solid ${T.border}`,
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)"
                }}
            >

                {/* Header */}
                <div className="p-5" style={{ borderBottom: `1px solid ${T.borderHi}` }}>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
    
                            <div className="p-2.5 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                                <Shield size={20} style={{ color: T.accent }} />
                            </div>
    
                            <div>
                                <h1 className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
                                    NexSyncHub
                                </h1>
    
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
                                    Admin Panel
                                </p>
                            </div>
    
                        </div>
                        
                        <Link href="/admin/settings" className="p-2 -mr-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-white" title="Admin Settings">
                            <Settings size={18} />
                        </Link>
                    </div>

                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

                    {links.map(renderLink)}

                    <div className="pt-6 pb-2 px-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
                            Security
                        </span>
                    </div>

                    {securityLinks.map(renderLink)}

                </nav>

                {/* Footer / User Menu */}
                <div className="p-4" style={{ borderTop: `1px solid ${T.borderHi}` }}>
                    <AdminUserMenu />
                </div>

            </aside>

            {/* Main Content */}
            <main className="flex-1 relative z-10 overflow-y-auto">
                {children}
            </main>

        </div>
    );

}