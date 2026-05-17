"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  LogOut,
  Loader2,
} from "lucide-react";

import { socket }
  from "@/lib/socket";

interface SecurityLog {

  _id: string;

  action: string;

  ip?: string;

  userAgent?: string;

  createdAt: string;

  metadata?: any;

  user?: {

    username?: string;

    email?: string;

    avatar?: string;

    role?: string;

  };

}

export default function AuthLogsPage() {

  const [
    logs,
    setLogs,
  ] = useState<
    SecurityLog[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // 🔥 Fetch logs
  useEffect(() => {

    const fetchLogs =
      async () => {

        try {

          const res =
            await fetch(
              "/api/admin/security/auth-logs"
            );

          const data =
            await res.json();

          if (res.ok) {

            setLogs(
              data.logs
            );

          }

        } catch (error) {

          console.error(
            "FETCH AUTH LOGS ERROR:",
            error
          );

        } finally {

          setLoading(false);

        }

      };

    fetchLogs();

  }, []);

  // 🔥 Realtime logs
  useEffect(() => {

    socket.emit(
      "join_admin_global"
    );

    socket.on(
      "admin_security_log_created",

      (newLog) => {

        setLogs(
          (prev) => [

            newLog,

            ...prev,

          ]
        );

      }
    );

    return () => {

      socket.off(
        "admin_security_log_created"
      );

    };

  }, []);

  // 🔥 Action label
  const getActionText = (
    log: SecurityLog
  ) => {

    switch (
      log.action
    ) {

      case "auth_login":
        return "Successful login";

      case "auth_login_failed":
        return "Failed login";

      case "auth_register":
        return "New registration";

      case "auth_logout":
        return "Logout";

      default:
        return log.action;

    }

  };

  // 🔥 Action icon
  const getIcon = (
    action: string
  ) => {

    switch (
      action
    ) {

      case "auth_login":
        return (
          <ShieldCheck
            className="w-5 h-5 text-emerald-400"
          />
        );

      case "auth_login_failed":
        return (
          <ShieldAlert
            className="w-5 h-5 text-red-400"
          />
        );

      case "auth_register":
        return (
          <UserPlus
            className="w-5 h-5 text-blue-400"
          />
        );

      case "auth_logout":
        return (
          <LogOut
            className="w-5 h-5 text-orange-400"
          />
        );

      default:
        return null;

    }

  };

  // 🔥 Card style
  const getCardStyle = (
    action: string
  ) => {

    if (
      action ===
      "auth_login_failed"
    ) {

      return
        "border-red-500/20 bg-red-500/5";

    }

    return
      "border-gray-800 bg-gray-900";

  };

  if (loading) {

    return (

      <div
        className="h-full flex items-center justify-center"
      >

        <Loader2
          className="w-10 h-10 animate-spin text-indigo-500"
        />

      </div>

    );

  }

  return (

    <div
      className="p-6 text-white"
    >

      {/* Header */}
      <div
        className="mb-8"
      >

        <h1
          className="text-3xl font-bold"
        >
          Authentication Logs
        </h1>

        <p
          className="text-gray-400 mt-2"
        >
          Realtime authentication
          and security activity
        </p>

      </div>

      {/* Feed */}
      <div
        className="space-y-4"
      >

        {logs.map(
          (log) => (

            <div
              key={log._id}
              className={`rounded-2xl border p-5 transition-all ${getCardStyle(log.action)}`}
            >

              <div
                className="flex items-start justify-between gap-4"
              >

                {/* Left */}
                <div
                  className="flex gap-4"
                >

                  {/* Icon */}
                  <div
                    className="mt-1"
                  >
                    {getIcon(
                      log.action
                    )}
                  </div>

                  {/* Content */}
                  <div>

                    <p
                      className="font-semibold text-white"
                    >

                      {getActionText(
                        log
                      )}

                    </p>

                    <p
                      className="text-sm text-gray-400 mt-1"
                    >

                      {log.user?.username ||

                        log.metadata?.email ||

                        "Unknown User"}

                    </p>

                    {/* Failed reason */}
                    {log.action ===
                      "auth_login_failed"

                      &&

                      log.metadata
                        ?.reason && (

                        <p
                          className="text-xs text-red-400 mt-2"
                        >

                          Reason:
                          {" "}

                          {
                            log
                              .metadata
                              .reason
                          }

                        </p>

                      )}

                    {/* User agent */}
                    <p
                      className="text-xs text-gray-500 mt-2 line-clamp-1"
                    >

                      {
                        log.userAgent
                      }

                    </p>

                    {/* IP */}
                    <p
                      className="text-xs text-gray-600 mt-1"
                    >

                      IP:
                      {" "}

                      {
                        log.ip
                      }

                    </p>

                  </div>

                </div>

                {/* Time */}
                <div
                  className="text-xs text-gray-500 whitespace-nowrap"
                >

                  {new Date(
                    log.createdAt
                  ).toLocaleString()}

                </div>

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );

}