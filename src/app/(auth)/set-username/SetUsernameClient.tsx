"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SetUsernameClient() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { update } = useSession();

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/user/set-username", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
            } else {
                await update(); // 🔥 refresh session

                router.push("/dashboard");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="space-y-4 border p-6 rounded-lg w-80"
            >
                <h1 className="text-xl font-semibold">Set Username</h1>

                <input
                    type="text"
                    placeholder="username"
                    className="w-full border p-2 rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white p-2 rounded"
                >
                    {loading ? "Saving..." : "Continue"}
                </button>

                {error && (
                    <p className="text-red-500 text-sm text-center">
                        {error}
                    </p>
                )}
            </form>
        </div>
    );
}