"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    ChevronUp,
    User,
    Settings,
    Bell,
    LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function UserMenu() {

    const { data: session, status } = useSession();

    const router = useRouter();

    const [open, setOpen] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 🔥 Close on outside click
    useEffect(() => {

        const handleClickOutside = (e: MouseEvent) => {

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
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

    return (
        <div
            className="relative"
            ref={dropdownRef}
        >

            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
        hover:bg-white/5 transition-colors cursor-pointer"
            >

                {/* Avatar */}
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

                <ChevronUp
                    size={16}
                    className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""
                        }`}
                />

            </button>

            {/* Dropdown */}
            <AnimatePresence>
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
                                signOut({
                                    callbackUrl: "/login",
                                })
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