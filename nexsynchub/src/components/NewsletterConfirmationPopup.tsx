"use client";

import { useEffect } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

const NEWSLETTER_VERIFIED_EVENT_KEY =
  "nexsynchub:newsletter:verified";

export default function NewsletterConfirmationPopup() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status =
    searchParams.get("newsletter");

  const isVisible =
    status === "confirmed" ||
    status === "invalid";

  const isConfirmed =
    status === "confirmed";

  const closePopup = () => {
    router.replace(pathname, {
      scroll: false,
    });
  };

  return (
    <>
      <NewsletterVerificationSignal
        isConfirmed={isConfirmed}
      />

      {isVisible && (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 pointer-events-none">
      <motion.div
        initial={{
          opacity: 0,
          y: 12,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#070b19]/95 p-5 text-white shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isConfirmed
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-rose-500/10 text-rose-300"
            }`}
          >
            {isConfirmed ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-wide">
              {isConfirmed
                ? "Subscription confirmed"
                : "Confirmation link expired"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-400">
              {isConfirmed
                ? "You are verified for future NexSyncHub intelligence updates and operational digests."
                : "Please submit your email again to receive a fresh verification link."}
            </p>
          </div>

          <button
            type="button"
            onClick={closePopup}
            aria-label="Close confirmation popup"
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={closePopup}
          className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-slate-200"
        >
          Continue
        </button>
      </motion.div>
    </div>
      )}
    </>
  );
}

function NewsletterVerificationSignal({
  isConfirmed,
}: {
  isConfirmed: boolean;
}) {
  useEffect(() => {
    if (!isConfirmed) {
      return;
    }

    const payload = JSON.stringify({
      verifiedAt: Date.now(),
    });

    window.localStorage.setItem(
      NEWSLETTER_VERIFIED_EVENT_KEY,
      payload
    );
    window.dispatchEvent(
      new CustomEvent(
        NEWSLETTER_VERIFIED_EVENT_KEY
      )
    );
  }, [isConfirmed]);

  return null;
}
