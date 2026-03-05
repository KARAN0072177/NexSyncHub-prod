"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation RequestPasswordReset($identifier: String!) {
            requestPasswordReset(identifier: $identifier)
          }
        `,
        variables: { identifier },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      setError(data.errors[0].message);
      return;
    }

    localStorage.setItem("resetIdentifier", identifier);

    window.location.href = "/reset-otp";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Forgot Password</h1>

        <input
          type="text"
          placeholder="Email or Username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="border p-2"
        />

        <button className="bg-black text-white p-2">
          Send OTP
        </button>

        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}