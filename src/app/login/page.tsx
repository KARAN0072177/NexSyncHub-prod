"use client";

import { useState } from "react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation LoginUser($identifier: String!, $password: String!) {
            loginUser(identifier: $identifier, password: $password) {
              id
              email
              username
            }
          }
        `,
        variables: { identifier, password },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      setMessage(data.errors[0].message);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80"
      >
        <h1 className="text-2xl font-bold">Login</h1>

        <input
          type="text"
          placeholder="Email or Username"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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

        <button className="bg-black text-white p-2">
          Login
        </button>

        {message && <p className="text-red-500">{message}</p>}
      </form>
    </div>
  );
}