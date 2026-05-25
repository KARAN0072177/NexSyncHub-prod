"use client";

interface Props {

  open: boolean;

  reason: string;

  expiresAt: string | null;

}

export default function BannedModal({

  open,
  reason,
  expiresAt,

}: Props) {

  if (!open) {
    return null;
  }

  return (

    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >

      <div
        className="w-full max-w-md rounded-3xl p-7"
        style={{

          background:
            "#0B1020",

          border:
            "1px solid rgba(255,255,255,0.08)",

        }}
      >

        <h2
          className="text-2xl font-bold text-white mb-3"
        >
          Account Restricted
        </h2>

        <p
          className="text-sm text-gray-400 mb-5"
        >
          Your account has been restricted due to policy violations.
        </p>

        {/* Reason */}
        <div
          className="rounded-2xl p-4 mb-4"
          style={{
            background:
              "rgba(255,255,255,0.04)",
          }}
        >

          <p
            className="text-xs uppercase tracking-wider text-gray-500 mb-2"
          >
            Reason
          </p>

          <p
            className="text-sm text-white"
          >
            {reason}
          </p>

        </div>

        {/* Expiry */}
        <div
          className="rounded-2xl p-4"
          style={{
            background:
              "rgba(255,255,255,0.04)",
          }}
        >

          <p
            className="text-xs uppercase tracking-wider text-gray-500 mb-2"
          >
            Restriction
          </p>

          <p
            className="text-sm text-white"
          >

            {

              expiresAt

                ? `Suspended until ${new Date(
                    expiresAt
                  ).toLocaleString()}`

                : "Permanent restriction"

            }

          </p>

        </div>

      </div>

    </div>

  );

}