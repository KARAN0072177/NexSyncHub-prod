"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await fetch("/api/workspace/my");
                const data = await res.json();

                if (res.ok) {
                    setWorkspaces(data.workspaces);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaces();
    }, []);

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Your Workspaces</h1>

            <button
                onClick={() => router.push("/dashboard/create")}
                className="bg-black text-white px-4 py-2 rounded"
            >
                + Create Workspace
            </button>

            <div className="space-y-3">
                {workspaces.length === 0 ? (
                    <p>No workspaces yet</p>
                ) : (
                    workspaces.map((ws) => (
                        <div
                            key={ws._id}
                            onClick={() => router.push(`/dashboard/${ws._id}`)}
                            className="border p-4 rounded flex justify-between cursor-pointer hover:bg-gray-50"
                        >
                            <div>
                                <p className="font-medium">{ws.name}</p>
                                <p className="text-sm text-gray-500">
                                    Role: {ws.role}
                                </p>
                            </div>
                            <button
                                onClick={async (e) => {

                                    e.stopPropagation();

                                    try {
                                        const res = await fetch("/api/invite/create", {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            body: JSON.stringify({ workspaceId: ws._id }),
                                        });

                                        const data = await res.json();

                                        if (res.ok) {
                                            navigator.clipboard.writeText(data.inviteLink);
                                            alert("Invite link copied!");
                                        } else {
                                            alert(data.error);
                                        }
                                    } catch {
                                        alert("Something went wrong");
                                    }
                                }}
                                className="text-sm bg-gray-200 px-3 py-1 rounded color-black"
                            >
                                Invite
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}