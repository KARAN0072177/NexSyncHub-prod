"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(
                "/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(form),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.error || "Something went wrong");
            } else {
                setIsSubmitted(true);


            }
        } catch (err) {
            setMessage("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex min-h-screen items-center justify-center text-center">
                <div className="space-y-4 border p-6 rounded-lg w-96">
                    <h1 className="text-xl font-semibold">Check your email 📧</h1>

                    <p>
                        We sent a verification link to <b>{form.email}</b>
                    </p>

                    <p className="text-sm text-gray-500">
                        Please verify your email before logging in.
                    </p>

                    <button
                        onClick={() => router.push("/login")}
                        className="w-full bg-black text-white p-2 rounded"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <form
                onSubmit={handleSubmit}
                className="space-y-4 border p-6 rounded-lg w-80"
            >
                <h1 className="text-xl font-semibold">Register</h1>

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border p-2 rounded"
                    value={form.email}
                    onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                    }
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full border p-2 rounded"
                    value={form.password}
                    onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                    }
                    required
                />

                <input
                    type="password"
                    placeholder="Confirm Password"
                    className="w-full border p-2 rounded"
                    value={form.confirmPassword}
                    onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                    }
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white p-2 rounded"
                >
                    {loading ? "Creating..." : "Register"}
                </button>

                {message && (
                    <p className="text-sm text-center text-red-500">
                        {message}
                    </p>
                )}
            </form>
        </div>
    );

}