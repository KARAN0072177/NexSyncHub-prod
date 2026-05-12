"use client";

import Link from "next/link";

import {
  Bell,
  Search,
} from "lucide-react";

export default function DashboardNavbar() {

  return (

    <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">

      <div className="h-full px-6 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-8">

          {/* Logo */}
          <Link
            href="/dashboard"
            className="text-xl font-bold text-white tracking-tight"
          >
            NexSyncHub
          </Link>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 w-[280px]">

            <Search
              size={16}
              className="text-gray-500"
            />

            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm text-gray-300 placeholder:text-gray-500 w-full"
            />

          </div>

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          {/* Notifications */}
          <button className="relative p-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition">

            <Bell
              size={18}
              className="text-gray-300"
            />

            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />

          </button>

        </div>

      </div>

    </header>

  );

}