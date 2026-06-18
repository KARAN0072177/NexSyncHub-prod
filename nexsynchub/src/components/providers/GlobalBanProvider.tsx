"use client";

import { useEffect, useState } from "react";

import BannedModal from "../modal/BannedModal";

export default function GlobalBanProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [banModal, setBanModal] = useState({
    open: false,
    reason: "",
    expiresAt: null as string | null,
  });
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;

      setBanModal({
        open: true,
        reason: detail.reason,
        expiresAt: detail.expiresAt,
      });
      setIsBanned(true);
    };

    window.addEventListener("account-banned", handler);

    return () => {
      window.removeEventListener("account-banned", handler);
    };
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        if (response.ok) {
          return response;
        }

        if (
          response.status !== 401 &&
          response.status !== 403 &&
          response.status !== 429
        ) {
          return response;
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          return response;
        }

        const data = await response.clone().json();

        if (data.code === "ACCOUNT_BANNED") {
          window.dispatchEvent(
            new CustomEvent("account-banned", {
              detail: data,
            })
          );
        }
      } catch {}

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      <div
        style={{
          pointerEvents: isBanned ? "none" : "auto",
          userSelect: isBanned ? "none" : "auto",
          filter: isBanned ? "blur(5px)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {children}
      </div>

      <BannedModal
        open={banModal.open}
        reason={banModal.reason}
        expiresAt={banModal.expiresAt}
      />
    </>
  );
}
