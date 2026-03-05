"use client";

import { useState, useEffect } from "react";

export default function ResetOtpPage() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const identifier = localStorage.getItem("resetIdentifier");
    setEmail(identifier);
  }, []);

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError("Missing reset identifier");
      return;
    }

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation VerifyResetOtp($email: String!, $otp: String!) {
            verifyResetOtp(email: $email, otp: $otp)
          }
        `,
        variables: { email, otp },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      setError(data.errors[0].message);
      return;
    }

    window.location.href = "/reset-password";
  }

  async function resendOtp() {
    if (!email) return;

    await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation RequestPasswordReset($identifier: String!) {
            requestPasswordReset(identifier: $identifier)
          }
        `,
        variables: { identifier: email },
      }),
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={verifyOtp} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Enter OTP</h1>

        <input
          type="text"
          placeholder="OTP"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="border p-2"
        />

        <button className="bg-black text-white p-2">
          Verify OTP
        </button>

        <button
          type="button"
          onClick={resendOtp}
          className="text-blue-600"
        >
          Resend OTP
        </button>

        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}