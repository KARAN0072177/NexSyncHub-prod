// src/providers/DesktopNotificationProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { socket } from "@/lib/socket";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  triggerMentionAlert,
  playMentionChime,
  MentionNotificationPayload,
} from "@/lib/client/desktop-notifications";
import { Bell, BellRing, Volume2, VolumeX, X, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DesktopNotificationContextType {
  permission: NotificationPermission;
  isSupported: boolean;
  soundEnabled: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  testMentionAlert: () => void;
  toggleSound: () => void;
}

const DesktopNotificationContext = createContext<DesktopNotificationContextType>({
  permission: "default",
  isSupported: false,
  soundEnabled: true,
  requestPermission: async () => "default",
  testMentionAlert: () => {},
  toggleSound: () => {},
});

export const useDesktopNotifications = () => useContext(DesktopNotificationContext);

export default function DesktopNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showPromptBanner, setShowPromptBanner] = useState<boolean>(false);
  const [justEnabled, setJustEnabled] = useState<boolean>(false);

  // Initialize Notification & Service Worker support
  useEffect(() => {
    const supported = isNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPerm = getNotificationPermission();
      setPermission(currentPerm);

      // Register Service Worker for push notifications & OS background integration
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("NexSyncHub Notification Service Worker registered:", reg.scope);
          })
          .catch((err) => {
            console.warn("Service Worker registration failed:", err);
          });
      }

      // Check stored prompt dismissal
      try {
        const isDismissed = sessionStorage.getItem("nexsync_notif_prompt_dismissed") === "true";
        if (currentPerm === "default" && !isDismissed) {
          // Delay showing prompt slightly so it doesn't jarringly pop on initial render
          const timer = setTimeout(() => setShowPromptBanner(true), 2500);
          return () => clearTimeout(timer);
        }
      } catch {
        // Ignore storage errors
      }
    }

    // Check sound preference
    try {
      const muted = localStorage.getItem("nexsync_sound_muted") === "true";
      setSoundEnabled(!muted);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Connect socket and listen for mention notifications
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Join user's personal channel on the socket server
    socket.emit("join_channel", userId);

    const handleNewNotification = (notification: MentionNotificationPayload) => {
      // Only trigger desktop alert and chime for mentions (per current scope)
      if (notification?.type === "mention") {
        triggerMentionAlert(notification, {
          playSound: soundEnabled,
        });
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [session, soundEnabled]);

  // Request browser permission
  const handleRequestPermission = useCallback(async (): Promise<NotificationPermission> => {
    const result = await requestNotificationPermission();
    setPermission(result);

    if (result === "granted") {
      setJustEnabled(true);
      playMentionChime(0.4);
      setTimeout(() => {
        setShowPromptBanner(false);
        setJustEnabled(false);
      }, 3000);
    } else {
      setShowPromptBanner(false);
    }

    return result;
  }, []);

  // Test mention alert (triggers sound + desktop notification)
  const testMentionAlert = useCallback(() => {
    // Play test chime
    playMentionChime(0.5);

    // Fire test notification
    triggerMentionAlert(
      {
        _id: "test-preview",
        type: "mention",
        title: "Test Mention Alert 🔔",
        content: "Alex mentioned you in #general: 'Hey! Ready for the release sync?'",
        link: "/dashboard",
        sender: "Alex",
        channelName: "general",
      },
      {
        forceDesktopAlert: true,
        playSound: false, // already played above
      }
    );
  }, []);

  // Toggle sound muted/unmuted
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.removeItem("nexsync_sound_muted");
          playMentionChime(0.3); // Feedback sound
        } else {
          localStorage.setItem("nexsync_sound_muted", "true");
        }
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const dismissPrompt = () => {
    setShowPromptBanner(false);
    try {
      sessionStorage.setItem("nexsync_notif_prompt_dismissed", "true");
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <DesktopNotificationContext.Provider
      value={{
        permission,
        isSupported,
        soundEnabled,
        requestPermission: handleRequestPermission,
        testMentionAlert,
        toggleSound,
      }}
    >
      {children}

      {/* Floating Permission & Chime Prompt Banner */}
      <AnimatePresence>
        {session?.user && isSupported && showPromptBanner && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-40px)] sm:w-[420px]"
            id="desktop-notification-prompt"
          >
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-slate-950/90 p-4 text-slate-100 shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
              {/* Decorative radial background glow */}
              <div
                className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl pointer-events-none"
                aria-hidden
              />

              {justEnabled ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Desktop Alerts Enabled!</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      You will now hear a chime and receive desktop alerts when mentioned.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                        <BellRing className="h-4 w-4 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
                          Never Miss a Mention
                          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                          Receive desktop notifications & sound alerts when teammates @mention you, even with your browser minimized.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={dismissPrompt}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      title="Dismiss"
                      aria-label="Dismiss desktop notification prompt"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      onClick={testMentionAlert}
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                      title="Test the chime sound & preview alert"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                      <span>Test Chime</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={dismissPrompt}
                        type="button"
                        className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                      >
                        Later
                      </button>
                      <button
                        onClick={handleRequestPermission}
                        type="button"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        <span>Enable Alerts</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DesktopNotificationContext.Provider>
  );
}
