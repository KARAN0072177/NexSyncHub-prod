"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus(data.error || "Verification failed");
        } else {
          setStatus("Email verified successfully! You can close this tab.");
        }
      } catch {
        setStatus("Something went wrong");
      }
    };

    if (token) verify();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center text-center">
      <p>{status}</p>
    </div>
  );
}