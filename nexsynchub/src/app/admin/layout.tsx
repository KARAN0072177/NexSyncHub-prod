"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScrollText,
  Shield,
} from "lucide-react";

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
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-gray-950 flex flex-col">

        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-6">

          <div className="flex items-center gap-3">

            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>

            <div>
              <h1 className="font-semibold">
                NexSyncHub
              </h1>

              <p className="text-xs text-gray-400">
                Admin Panel
              </p>
            </div>

          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">

          {links.map((link) => {

            const Icon = link.icon;

            const active =
              pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                    : "text-gray-400 hover:bg-gray-900 hover:text-white"
                }`}
              >

                <Icon className="w-5 h-5" />

                <span>
                  {link.label}
                </span>

              </Link>
            );

          })}

        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );

}