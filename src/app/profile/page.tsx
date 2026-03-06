"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/graphql", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query {
              me {
                id
                email
                username
                lastLoginProvider
                accounts {
                  provider
                }
              }
            }
          `,
        }),
      });

      const data = await res.json();

      console.log("USER DATA:", data.data?.me);

      setUser(data.data?.me);
      setLoading(false);
    }

    fetchUser();
  }, []);

  if (loading) return <p className="p-10">Loading...</p>;

  if (!user) {
    return (
      <div className="p-10">
        <h1 className="text-xl font-bold">Please login first</h1>
      </div>
    );
  }

  const providers = user.accounts?.map((a: any) => a.provider) || [];

  const loginMethod =
    user.lastLoginProvider === "manual"
      ? "Email / Password"
      : user.lastLoginProvider || "Email / Password";

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      <div className="border p-4 space-y-2">
        <p>
          <strong>Username:</strong> {user.username}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Login Method:</strong> {loginMethod}
        </p>
      </div>

      <div className="mt-6 border p-4">
        <h2 className="font-bold mb-2">Linked Accounts</h2>

        <p>Email / Password</p>

        {providers.map((p: string, i: number) => (
          <p key={i}>{p}</p>
        ))}
        
      </div>
    </div>
  );
}