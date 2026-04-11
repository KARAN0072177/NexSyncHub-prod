"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function InvitePage() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleJoin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error);
      } else {
        setMessage("Joined successfully!");

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center text-center">
      <div className="space-y-4 border p-6 rounded-lg w-96">
        <h1 className="text-xl font-semibold">
          Join Workspace
        </h1>

        {!token ? (
          <p className="text-red-500">Invalid invite link</p>
        ) : (
          <>
            <p>Click below to join this workspace</p>

            <button
              onClick={handleJoin}
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded"
            >
              {loading ? "Joining..." : "Join Workspace"}
            </button>
          </>
        )}

        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}