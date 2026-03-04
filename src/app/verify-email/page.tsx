"use client";

import { useEffect } from "react";

export default function VerifyEmailPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    async function verify() {
      await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation VerifyEmail($token: String!) {
              verifyEmail(token: $token)
            }
          `,
          variables: { token },
        }),
      });
    }

    if (token) verify();
  }, []);

  return <div>Email verification in progress...</div>;
}