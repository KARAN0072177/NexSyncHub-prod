"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
import { set } from "mongoose";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

export default function ChatArea({ channel }: { channel: any }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<any[]>([]);
    const typingTimeout = useRef<any>(null);
    const [seenUsers, setSeenUsers] = useState<Set<string>>(new Set());

    const bottomRef = useRef<HTMLDivElement>(null);

    const { data: session } = useSession();

    // 📩 Fetch messages
    useEffect(() => {
        const fetchMessages = async () => {
            const res = await fetch(
                `/api/message/list?channelId=${channel._id}`
            );
            const data = await res.json();

            if (res.ok) {
                setMessages(data.messages);
            }
        };

        fetchMessages();
    }, [channel._id]);

    useEffect(() => {
        if (!channel?._id) return;

        const markRead = () => {
            fetch("/api/channel/read", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channelId: channel._id,
                }),
            });
        };

        // initial
        markRead();

        // 🔥 when user returns to tab
        window.addEventListener("focus", markRead);

        return () => {
            window.removeEventListener("focus", markRead);
        };
    }, [channel._id]);

    useEffect(() => {
        if (!channel?._id) return;

        // 🔥 Join channel
        socket.emit("join_channel", channel._id);

        // 🔥 Listen for messages
        socket.on("receive_message", (msg) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === msg._id);
                if (exists) return prev;
                return [...prev, msg];
            });

            // 🔥 Reset seen users for new message
            setSeenUsers(new Set());

            // 🔥 MARK AS READ immediately (THIS WAS MISSING)
            fetch("/api/channel/read", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channelId: channel._id,
                }),
            });
        });

        // 🔥 User typing
        socket.on("user_typing", (user) => {
            if (user.id === userId) return; // ❗ IGNORE SELF

            setTypingUsers((prev) => {
                if (prev.find((u) => u.id === user.id)) return prev;
                return [...prev, user];
            });
        });

        // 🔥 User stopped typing
        socket.on("user_stop_typing", (user) => {
            if (user.id === userId) return; // ❗ IGNORE SELF

            setTypingUsers((prev) =>
                prev.filter((u) => u.id !== user.id)
            );
        });

        socket.on("message_seen", ({ userId }) => {
            setSeenUsers((prev) => {
                const updated = new Set(prev);
                updated.add(userId); // ✅ prevents duplicates
                return updated;
            });
        });

        return () => {
            socket.off("receive_message");
            socket.off("user_typing");
            socket.off("user_stop_typing");
            socket.off("message_seen");
        };
    }, [channel._id]);

    // 📌 Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ✉️ Send message
    const handleSend = async () => {
        if (!content.trim()) return;

        setLoading(true);

        const res = await fetch("/api/message/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                channelId: channel._id,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === data.data._id);
                if (exists) return prev;
                return [...prev, data.data];
            });
            setContent("");
        } else {
            alert(data.error);
        }

        setLoading(false);
    };

    const userId = session?.user?.id;
    const username = session?.user?.username;

    if (!session?.user?.username) {
        return (
            <div className="p-6 text-gray-500">
                Please set your username to start chatting.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="border-b p-3 font-semibold">
                # {channel.name}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, index) => (
                    <div key={msg._id} className="text-sm">
                        <span className="font-medium">
                            {msg.sender?.username ?? "Unknown"}
                        </span>{" "}
                        {msg.content}

                        {/* 👇 Seen count */}
                        {index === messages.length - 1 && seenUsers.size > 0 && (
                            <div className="text-xs text-gray-400">
                                Seen by {seenUsers.size}
                            </div>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 flex gap-2">

                {typingUsers.length > 0 && (
                    <div className="text-sm text-gray-500 px-3">
                        {typingUsers.length === 1
                            ? `${typingUsers[0].username || "Someone"} is typing...`
                            : `${typingUsers
                                .filter((u) => u.username)
                                .map((u) => u.username)
                                .join(" and ")} are typing...`}
                    </div>
                )}
                <input
                    value={content}
                    onChange={(e) => {
                        setContent(e.target.value);

                        // ❗ Only emit if session is READY
                        if (!userId || !username) return;

                        // 🔥 Emit typing start
                        socket.emit("typing_start", {
                            channelId: channel._id,
                            user: {
                                id: userId,
                                username: username,
                            },
                        });

                        // 🔥 Clear previous timeout
                        if (typingTimeout.current) {
                            clearTimeout(typingTimeout.current);
                        }

                        // 🔥 Stop typing after 1.5s
                        typingTimeout.current = setTimeout(() => {
                            socket.emit("typing_stop", {
                                channelId: channel._id,
                                user: {
                                    id: userId,
                                    username: username,
                                },
                            });
                        }, 1500);
                    }}
                    placeholder="Type a message..."
                    className="flex-1 border p-2 rounded"
                />

                <button
                    onClick={handleSend}
                    className="bg-black text-white px-4 rounded"
                >
                    {loading ? "..." : "Send"}
                </button>
            </div>
        </div>
    );
}