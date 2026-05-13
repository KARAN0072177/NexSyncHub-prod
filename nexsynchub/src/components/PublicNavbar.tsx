"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function PublicNavbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-white"
        >
          NexSyncHub
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Home
          </Link>

          <Link
            href="/features"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Features
          </Link>

          <Link
            href="/about"
            className="text-gray-300 hover:text-white transition-colors"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {session ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Get Started
              </Link>
            </>
          )}

        </div>
      </div>
    </header>
  );
}