"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateWorkspacePage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isPrivate, setIsPrivate] = useState(true);

    const handleCreate = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/workspace/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, isPrivate }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error);
            } else {
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
                onSubmit={handleCreate}
                className="space-y-4 border p-6 rounded-lg w-80"
            >
                <h1 className="text-xl font-semibold">
                    Create Workspace
                </h1>

                <input
                    type="text"
                    placeholder="Workspace name"
                    className="w-full border p-2 rounded"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={!isPrivate}
                            onChange={() => setIsPrivate((prev) => !prev)}
                        />
                        <span>
                            {isPrivate ? "Private Workspace 🔒" : "Public Workspace 🌍"}
                        </span>
                    </label>

                    {!isPrivate && (
                        <p className="text-sm text-yellow-600">
                            ⚠️ This workspace will be visible to everyone.
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white p-2 rounded"
                >
                    {loading ? "Creating..." : "Create"}
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