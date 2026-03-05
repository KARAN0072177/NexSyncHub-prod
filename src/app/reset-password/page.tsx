"use client";

import { useState, useEffect } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const identifier = localStorage.getItem("resetIdentifier");

    if (!identifier) {
      window.location.href = "/forgot-password";
      return;
    }

    setEmail(identifier);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError("Missing reset identifier");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation ResetPassword($email: String!, $password: String!) {
            resetPassword(email: $email, password: $password)
          }
        `,
        variables: { email, password },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      setError(data.errors[0].message);
      return;
    }

    localStorage.removeItem("resetIdentifier");

    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <h1 className="text-2xl font-bold">Set New Password</h1>

        <input
          type="password"
          placeholder="New Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="border p-2"
        />

        <button className="bg-black text-white p-2">
          Update Password
        </button>

        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}