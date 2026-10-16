// src/lib/client/desktop-notifications.ts
// Handles Web Audio API chime alerts and HTML5 / Service Worker desktop notifications for mentions

export interface MentionNotificationPayload {
  _id?: string;
  type?: string;
  title?: string;
  content?: string;
  link?: string;
  workspace?: string;
  sender?: string;
  channelName?: string;
  createdAt?: string | Date;
}

/**
 * Checks if the Notifications API is available in the current browser environment
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

/**
 * Checks whether the NexSyncHub window is currently minimized, blurred, or in a background tab
 */
export function isWindowBackgrounded(): boolean {
  if (typeof document === "undefined") return false;
  return document.visibilityState === "hidden" || !document.hasFocus();
}

/**
 * Plays a clean, modern dual-harmonic chime for mentions using the Web Audio API.
 * Synthesized dynamically in-browser: zero external audio assets, zero network latency, zero CORS issues.
 */
export function playMentionChime(volume = 0.4): void {
  if (typeof window === "undefined") return;

  // Check if sound is muted by user preference
  try {
    const soundDisabled = localStorage.getItem("nexsync_sound_muted") === "true";
    if (soundDisabled) return;
  } catch {
    // Ignore localStorage errors
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // In modern browsers, AudioContext starts suspended if no user interaction has occurred yet
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const clampedVolume = Math.max(0.01, Math.min(volume, 1));

    // ── Primary Tone: Warm, musical rising glide (D5 -> A5) ──
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(clampedVolume * 0.7, now + 0.025);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // ── Harmonic Sparkle: High octave shimmer for crisp presence (D6 -> A6) ──
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1174.66, now + 0.06); // D6
    osc2.frequency.exponentialRampToValueAtTime(1760.0, now + 0.2); // A6

    gain2.gain.setValueAtTime(0.0001, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(clampedVolume * 0.35, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Play oscillators
    osc1.start(now);
    osc1.stop(now + 0.48);

    osc2.start(now + 0.06);
    osc2.stop(now + 0.58);
  } catch (err) {
    console.warn("Could not synthesize mention sound alert:", err);
  }
}

/**
 * Triggers a native Desktop / OS notification
 */
export async function showDesktopNotification({
  title,
  body,
  link,
  tag,
}: {
  title: string;
  body: string;
  link?: string;
  tag?: string;
}): Promise<void> {
  if (!isNotificationSupported()) return;

  if (Notification.permission !== "granted") {
    return;
  }

  const icon = "/logo-icon.png";
  const badge = "/favicon.ico";
  const notificationTag = tag || `mention-${Date.now()}`;
  const targetUrl = link || "/dashboard";

  // 1. Try Service Worker registration first (gives best OS & background tab integration)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && "showNotification" in reg) {
        await reg.showNotification(title, {
          body,
          icon,
          badge,
          tag: notificationTag,
          data: { url: targetUrl },
        });
        return;
      }
    } catch (err) {
      console.warn("ServiceWorker showNotification failed, falling back to Notification constructor:", err);
    }
  }

  // 2. Fallback to standard window Notification constructor
  try {
    const notification = new Notification(title, {
      body,
      icon,
      badge,
      tag: notificationTag,
      data: { url: targetUrl },
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (targetUrl) {
        window.location.href = targetUrl;
      }
      notification.close();
    };
  } catch (err) {
    console.warn("Desktop notification display error:", err);
  }
}

/**
 * Master dispatcher for incoming mention notifications:
 * - Plays the audio chime
 * - If browser is minimized or user is in another tab/app, fires the native OS notification
 */
export async function triggerMentionAlert(
  payload: MentionNotificationPayload,
  options?: { forceDesktopAlert?: boolean; playSound?: boolean }
): Promise<void> {
  const shouldPlaySound = options?.playSound ?? true;
  const forceDesktop = options?.forceDesktopAlert ?? false;

  // 1. Play sound chime
  if (shouldPlaySound) {
    playMentionChime(0.45);
  }

  // 2. Check if user is away / minimized or if forced
  const isAway = isWindowBackgrounded() || forceDesktop;

  if (isAway && isNotificationSupported() && Notification.permission === "granted") {
    const title =
      payload.title ||
      (payload.sender && payload.channelName
        ? `@${payload.sender} mentioned you in #${payload.channelName}`
        : "You were mentioned on NexSyncHub");

    // Extract clean body text (strip quotes if already wrapped)
    const body = payload.content || "Click to open the conversation";
    const link = payload.link || "/dashboard";
    const tag = payload._id ? `mention-${payload._id}` : `mention-${Date.now()}`;

    await showDesktopNotification({
      title,
      body,
      link,
      tag,
    });
  }
}
