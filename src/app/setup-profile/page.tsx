"use client";

import { useEffect, useState } from "react";

export default function SetupProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("verifiedEmail");
    if (storedEmail) setEmail(storedEmail);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          mutation SetupUsername($email: String!, $username: String!) {
            setupUsername(email: $email, username: $username) {
              id
              username
            }
          }
        `,
        variables: { email, username },
      }),
    });

    const data = await res.json();

    if (data.errors) {
      setMessage(data.errors[0].message);
      return;
    }

    localStorage.removeItem("verifiedEmail");

    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-80"
      >
        <h1 className="text-2xl font-bold">Choose Username</h1>

        <input
          type="text"
          placeholder="Username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2"
        />

        <button className="bg-black text-white p-2">
          Continue
        </button>

        {message && <p className="text-red-500">{message}</p>}
      </form>
    </div>
  );
}