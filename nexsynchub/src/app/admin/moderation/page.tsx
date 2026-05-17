"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { socket }
  from "@/lib/socket";

interface ModerationLog {

  _id: string;

  action: string;

  createdAt: string;

  metadata?: any;

  user?: {

    username?: string;

    email?: string;

    avatar?: string;

    role?: string;

  };

}

export default function ModerationPage() {

  const [
    logs,
    setLogs,
  ] = useState<
    ModerationLog[]
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
              "/api/admin/security/moderation"
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
            "MODERATION FETCH ERROR:",
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

        // 🔥 Only moderation logs
        if (
          newLog.action !==
          "unsafe_avatar_upload"
        ) {
          return;
        }

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

          Moderation Center

        </h1>

        <p
          className="text-gray-400 mt-2"
        >

          Realtime trust & safety
          monitoring system

        </p>

      </div>

      {/* Feed */}
      <div
        className="space-y-5"
      >

        {logs.map(
          (log) => (

            <div
              key={log._id}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5"
            >

              <div
                className="flex items-start justify-between gap-4"
              >

                {/* LEFT */}
                <div
                  className="flex gap-4"
                >

                  {/* Icon */}
                  <div
                    className="mt-1"
                  >

                    <ShieldAlert
                      className="w-6 h-6 text-red-400"
                    />

                  </div>

                  {/* Content */}
                  <div>

                    {/* Title */}
                    <div
                      className="flex items-center gap-2"
                    >

                      <AlertTriangle
                        className="w-4 h-4 text-red-300"
                      />

                      <p
                        className="font-semibold text-white"
                      >

                        Unsafe avatar upload blocked

                      </p>

                    </div>

                    {/* User */}
                    <p
                      className="text-sm text-gray-300 mt-2"
                    >

                      User:
                      {" "}

                      <span
                        className="font-medium"
                      >

                        {log.user?.username ||

                          "Unknown User"}

                      </span>

                    </p>

                    {/* Email */}
                    <p
                      className="text-xs text-gray-500 mt-1"
                    >

                      {
                        log.user?.email
                      }

                    </p>

                    {/* File Info */}
                    <div
                      className="mt-4 space-y-1"
                    >

                      <p
                        className="text-sm text-gray-300"
                      >

                        File:
                        {" "}

                        {
                          log.metadata
                            ?.filename
                        }

                      </p>

                      <p
                        className="text-xs text-gray-500"
                      >

                        {
                          log.metadata
                            ?.mimeType
                        }

                        {" • "}

                        {(
                          (
                            log.metadata
                              ?.size || 0
                          ) /

                          1024 /

                          1024
                        ).toFixed(2)}

                        MB

                      </p>

                    </div>

                    {/* Moderation Labels */}
                    <div
                      className="mt-5"
                    >

                      <p
                        className="text-sm font-medium text-red-300 mb-3"
                      >

                        Detected Labels

                      </p>

                      <div
                        className="flex flex-wrap gap-2"
                      >

                        {log.metadata
                          ?.moderationLabels
                          ?.map(

                            (
                              label: any,
                              index: number
                            ) => (

                              <div
                                key={index}
                                className="px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"
                              >

                                <p
                                  className="text-sm text-red-200 font-medium"
                                >

                                  {
                                    label.name
                                  }

                                </p>

                                <p
                                  className="text-xs text-red-400 mt-1"
                                >

                                  {Math.round(
                                    label.confidence
                                  )}

                                  % confidence

                                </p>

                              </div>

                            )

                          )}

                      </div>

                    </div>

                  </div>

                </div>

                {/* RIGHT */}
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