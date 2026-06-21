"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
  options?: {
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact";
  };
}

export default function Turnstile({ onVerify, options = {} }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onVerifyRef = useRef(onVerify);

  // Keep onVerify ref updated to avoid triggering effect when parent function changes
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  const theme = options.theme || "dark";
  const size = options.size || "normal";

  useEffect(() => {
    let active = true;
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;

    if (!sitekey) {
      console.warn("NEXT_PUBLIC_TURNSTILE_SITEKEY is not defined.");
      return;
    }

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current || !active) return;

      // Clean up previous widget if any
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          console.error(e);
        }
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey,
          callback: (token: string) => {
            if (active) onVerifyRef.current(token);
          },
          theme,
          size,
        });
        widgetIdRef.current = id;
      } catch (error) {
        console.error("Error rendering Turnstile widget:", error);
      }
    };

    // If script is already loaded
    if (window.turnstile) {
      renderWidget();
    } else {
      // Poll until window.turnstile is available
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);

      return () => {
        clearInterval(interval);
        active = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
            widgetIdRef.current = null;
          } catch (e) {
            console.error(e);
          }
        }
      };
    }

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [theme, size]);

  return <div ref={containerRef} className="flex justify-center my-2 min-h-[65px]" />;
}

// Add global type declaration
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact";
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}
