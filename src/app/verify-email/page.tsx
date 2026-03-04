"use client";

import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
    const [status, setStatus] = useState("Verifying...");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        async function verify() {
            const res = await fetch("/api/graphql", {
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

            const data = await res.json();

            if (data.data?.verifyEmail) {
                setStatus("Email verified successfully");

                const email = localStorage.getItem("pendingVerificationEmail");

                if (email) {
                    localStorage.setItem("verifiedEmail", email);
                }

                setTimeout(() => {
                    window.location.href = "/setup-profile";
                }, 1500);
            } else {
                setStatus("Verification failed");
            }
        }

        if (token) verify();
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">{status}</h1>
            </div>
        </div>
    );
}