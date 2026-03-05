"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query: `
            query {
              me {
                id
                username
                email
              }
            }
          `,
        }),
      });

      const data = await res.json();

      setUser(data.data?.me || null);
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    await fetch("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        query: `
          mutation {
            logout
          }
        `,
      }),
    });

    window.location.reload();
  }

  return (
    <nav className="flex justify-between p-4 border-b">
      <h1 className="font-bold">NexSyncHub</h1>

      {user ? (
        <button
          onClick={handleLogout}
          className="bg-black text-white px-4 py-1"
        >
          Logout
        </button>
      ) : (
        <a
          href="/login"
          className="bg-black text-white px-4 py-1"
        >
          Login
        </a>
      )}
    </nav>
  );
}