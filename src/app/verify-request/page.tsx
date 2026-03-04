"use client";

import { useEffect, useState } from "react";

export default function VerifyRequestPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("pendingVerificationEmail");
    if (stored) setEmail(stored);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Verification email sent
        </h1>

        <p>
          Please check your inbox at <b>{email}</b>
        </p>
      </div>
    </div>
  );
}