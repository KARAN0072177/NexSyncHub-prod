"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Layers,
  Info,
  Mail,
  LogIn,
  Zap,
  LayoutDashboard,
  Shield,
  CreditCard,
  Menu,
  X,
} from "lucide-react";

const navLinks = [
  { name: "Home", href: "/", icon: Home },
  { name: "Features", href: "/features", icon: Layers },
  { name: "Pricing", href: "/pricing", icon: CreditCard },
  { name: "About", href: "/about", icon: Info },
  { name: "Support", href: "/support-center", icon: Mail },
];

type SessionUserWithRole = {
  role?: string;
};

export default function PublicNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userRole = (session?.user as SessionUserWithRole | undefined)?.role;
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  return (
    <header className="fixed top-3 inset-x-3 sm:top-4 sm:inset-x-6 z-50 flex justify-center">
      <div className="w-full max-w-6xl min-w-0 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-indigo-500/10 transition-all">
        <div className="h-14 px-3 sm:h-16 sm:px-6 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 group"
        >
          <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="truncate text-base font-bold tracking-tight text-white sm:text-xl">
            NexSyncHub
          </span>
        </Link>

        {/* Center Links - Pill shaped inner nav */}
        <nav className="hidden md:flex items-center gap-1 p-1.5 rounded-full border border-white/5 bg-white/[0.02]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-navbar-underline"
                    className="absolute bottom-0 left-4 right-4 h-[2px] bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.6)]"
                  />
                )}
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            isAdmin ? (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-all text-sm font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-all text-sm font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>

              <Link
                href="/register"
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]"
              >
                Get Started
                <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="border-t border-white/10 px-3 py-4 sm:px-6 sm:py-6 space-y-4">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white/10 text-white"
                            : "text-gray-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <link.icon className="w-5 h-5" />
                        {link.name}
                      </Link>
                    );
                  })}
                </nav>

                <div className="h-px bg-white/10 my-4" />

                <div className="flex flex-col gap-3">
                  {session ? (
                    isAdmin ? (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black hover:bg-gray-200 transition-all text-sm font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                      >
                        <Shield className="w-5 h-5" />
                        Admin Panel
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-black hover:bg-gray-200 transition-all text-sm font-semibold shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                      </Link>
                    )
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-semibold"
                      >
                        <LogIn className="w-5 h-5" />
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all text-sm font-semibold text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]"
                      >
                        Get Started
                        <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
