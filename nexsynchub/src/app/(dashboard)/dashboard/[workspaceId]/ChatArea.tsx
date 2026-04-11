"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function ChatArea({ channel }: { channel: any }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    const bottomRef = useRef<HTMLDivElement>(null);

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

        // 🔥 Join channel
        socket.emit("join_channel", channel._id);

        // 🔥 Listen for messages
        socket.on("receive_message", (msg) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === msg._id);
                if (exists) return prev;
                return [...prev, msg];
            });
        });

        return () => {
            socket.off("receive_message");
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

    return (
        <div className="flex flex-col h-full">

            {/* Header */}
            <div className="border-b p-3 font-semibold">
                # {channel.name}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg) => (
                    <div key={msg._id} className="text-sm">
                        <span className="font-medium">
                            {msg.sender?.username ?? "Unknown"}
                        </span>{" "}
                        {msg.content}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t p-3 flex gap-2">
                <input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
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