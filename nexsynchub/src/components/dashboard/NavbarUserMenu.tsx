"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import Link from "next/link";

import { logout } from "@/lib/client/logout";

import {
  Settings,
  LogOut,
  ChevronDown,
  UserPlus,
  Users,
  CheckCircle2,
} from "lucide-react";

import UserAvatar from "@/components/shared/UserAvatar";

type NavbarUserMenuProps = {
  user: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
    avatar?: string | null;
  };
};

type RememberedAccount = {
  id?: string | null;
  name?: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  avatar?: string | null;
  lastUsedAt: number;
};

const ACCOUNT_STORAGE_KEY =
  "nexsynchub:remembered-accounts";

const ACCOUNT_STORAGE_EVENT =
  "nexsynchub:remembered-accounts-updated";

function getAccountsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return (
    window.localStorage.getItem(
      ACCOUNT_STORAGE_KEY
    ) || "[]"
  );
}

function subscribeToAccounts(
  onStoreChange: () => void
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(
    "storage",
    onStoreChange
  );

  window.addEventListener(
    ACCOUNT_STORAGE_EVENT,
    onStoreChange
  );

  return () => {
    window.removeEventListener(
      "storage",
      onStoreChange
    );

    window.removeEventListener(
      ACCOUNT_STORAGE_EVENT,
      onStoreChange
    );
  };
}

export default function NavbarUserMenu({
  user,
}: NavbarUserMenuProps) {

  const [open, setOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentEmail =
    user.email?.toLowerCase() || "";

  const accountsSnapshot =
    useSyncExternalStore(
      subscribeToAccounts,
      getAccountsSnapshot,
      () => "[]"
    );

  const accounts =
    useMemo(() => {
      try {
        const parsed =
          JSON.parse(
            accountsSnapshot
          ) as RememberedAccount[];

        return parsed.filter(
          (account) => account.email
        );
      } catch {
        return [];
      }
    }, [accountsSnapshot]);

  useEffect(() => {
    if (!currentEmail) return;

    try {
      const stored =
        window.localStorage.getItem(
          ACCOUNT_STORAGE_KEY
        );

      const parsed: RememberedAccount[] =
        stored ? JSON.parse(stored) : [];

      const currentAccount: RememberedAccount = {
        id: user.id,
        name: user.name,
        email: currentEmail,
        image: user.image,
        username: user.username,
        avatar: user.avatar,
        lastUsedAt: Date.now(),
      };

      const nextAccounts = [
        currentAccount,
        ...parsed.filter(
          (account) =>
            account.email.toLowerCase() !== currentEmail
        ),
      ].slice(0, 5);

      window.localStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify(nextAccounts)
      );

      window.dispatchEvent(
        new Event(ACCOUNT_STORAGE_EVENT)
      );
    } catch (error) {
      console.error(
        "ACCOUNT_SWITCHER_STORAGE_ERROR:",
        error
      );
    }
  }, [
    currentEmail,
    user.avatar,
    user.email,
    user.id,
    user.image,
    user.name,
    user.username,
  ]);

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

      await logout();

    } catch (err) {

      console.error(err);

      setLoggingOut(false);

    }

  };

  const redirectToLoginForAccount =
    async (email?: string) => {
      const params =
        new URLSearchParams();

      params.set(
        "callbackUrl",
        "/dashboard"
      );

      if (email) {
        params.set("email", email);
        params.set("switchAccount", "1");
      } else {
        params.set("addAccount", "1");
      }

      setLoggingOut(true);

      await logout(
        `/login?${params.toString()}`
      );
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
        <div className="absolute right-0 top-14 w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-50">

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

          {/* Account Switcher */}
          <div className="p-2 border-b border-gray-800">

            <div className="px-3 py-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gray-500">
              <Users size={14} />
              Accounts
            </div>

            <div className="space-y-1">
              {accounts.map((account) => {
                const isCurrent =
                  account.email.toLowerCase() ===
                  currentEmail;

                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      if (isCurrent) return;
                      redirectToLoginForAccount(
                        account.email
                      );
                    }}
                    disabled={
                      isCurrent ||
                      loggingOut
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isCurrent
                        ? "bg-blue-500/10 text-white cursor-default"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <UserAvatar
                      src={
                        account.avatar ||
                        account.image ||
                        ""
                      }
                      name={
                        account.name ||
                        account.username ||
                        account.email
                      }
                      size="sm"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {account.name ||
                          account.username ||
                          "NexSyncHub user"}
                      </p>

                      <p className="text-xs text-gray-500 truncate">
                        {account.email}
                      </p>
                    </div>

                    {isCurrent && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                redirectToLoginForAccount()
              }
              disabled={loggingOut}
              className="mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              <UserPlus size={16} />
              Add account
            </button>

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
