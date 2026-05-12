"use client";

import { useState, useRef, useEffect } from "react";

import Link from "next/link";

import { signOut } from "next-auth/react";

import {
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

import UserAvatar from "@/components/shared/UserAvatar";

type NavbarUserMenuProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    avatar?: string | null;
  };
};

export default function NavbarUserMenu({
  user,
}: NavbarUserMenuProps) {

  const [open, setOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    const handleClickOutside = (
      e: MouseEvent
    ) => {

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          e.target as Node
        )
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

  const handleLogout = async () => {

    try {

      setLoggingOut(true);

      await signOut({
        callbackUrl: "/login",
      });

    } catch (err) {

      console.error(err);

      setLoggingOut(false);

    }

  };

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >

      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-800 transition-all"
      >

        <UserAvatar
          src={user.avatar || user.image || ""}
          name={user.name || user.username || "U"}
          size="sm"
        />

        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform
            ${open ? "rotate-180" : ""}
          `}
        />

      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-14 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">

          {/* User Info */}
          <div className="p-4 border-b border-gray-800">

            <div className="flex items-center gap-3">

              <UserAvatar
                src={user.avatar || user.image || ""}
                name={user.name || user.username || "U"}
                size="md"
              />

              <div className="min-w-0">

                <p className="text-sm font-semibold text-white truncate">
                  {user.name || user.username}
                </p>

                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>

              </div>

            </div>

          </div>

          {/* Links */}
          <div className="p-2">

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              <Settings size={16} />
              Settings
            </Link>

          </div>

          {/* Logout */}
          <div className="p-2 border-t border-gray-800">

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={16} />

              {loggingOut
                ? "Logging out..."
                : "Logout"}
            </button>

          </div>

        </div>
      )}

    </div>
  );
}