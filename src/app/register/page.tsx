"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation RegisterUser($email: String!, $password: String!) {
            registerUser(email: $email, password: $password) {
              id
              email
            }
          }
        `,
        variables: { email, password },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      setMessage(data.errors[0].message);
      return;
    }

    localStorage.setItem("pendingVerificationEmail", email);

    window.location.href = "/verify-request";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80"
      >
        <h1 className="text-2xl font-bold">Register</h1>

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border p-2"
        />

        <button
          type="submit"
          className="bg-black text-white p-2"
        >
          Register
        </button>

        <a
          href="/api/auth/google"
          className="border p-2 text-center"
        >
          Continue with Google
        </a>

        {message && <p className="text-red-500">{message}</p>}
      </form>
    </div>
  );
}