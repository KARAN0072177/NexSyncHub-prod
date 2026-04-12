"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

export default function ChatArea({ channel }: { channel: any }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [typingUsers, setTypingUsers] = useState<any[]>([]);
    const typingTimeout = useRef<any>(null);
    const [seenUsers, setSeenUsers] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const socketRef = useRef<any>(null);
    const [uploading, setUploading] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    const userId = session?.user?.id;
    const username = session?.user?.username;

    const [attachments, setAttachments] = useState<Attachment[]>([]);

    type Attachment = {
        key: string;
        type: "image" | "video" | "file";
        name?: string;
        size?: number;
    };

    // 🔥 INIT SOCKET (ONLY ONCE)
    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

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

    // 🔥 Mark read
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

        markRead();
        window.addEventListener("focus", markRead);

        return () => {
            window.removeEventListener("focus", markRead);
        };
    }, [channel._id]);

    // 🔥 FILE UPLOAD
    const handleFileUpload = async (e: any) => {

        if (uploading) {
            alert("Please wait for upload to finish");
            return;
        }

        const files = e.target.files;

        if (!files.length) return;

        setUploading(true); // 🔥 LOCK SEND

        const uploadedFiles: Attachment[] = [];

        for (let file of files) {
            const res = await fetch("/api/upload-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                }),
            });

            const { uploadUrl, key } = await res.json();

            await fetch(uploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type,
                },
                body: file,
            });

            let fileType: "image" | "video" | "file" = "file";

            if (file.type.startsWith("image")) fileType = "image";
            else if (file.type.startsWith("video")) fileType = "video";

            uploadedFiles.push({
                key,
                type: fileType,
                name: file.name,
                size: file.size,
            });
        }

        // 🔥 Update once (NOT inside loop)
        setAttachments((prev) => [...prev, ...uploadedFiles]);

        setUploading(false); // 🔓 UNLOCK SEND
    };

    // 🔥 SOCKET LISTENERS
    useEffect(() => {
        if (!channel?._id || !socketRef.current) return;

        const socket = socketRef.current;

        socket.emit("join_channel", channel._id);

        socket.on("receive_message", (msg: any) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === msg._id);
                if (exists) return prev;
                return [...prev, msg];
            });

            setSeenUsers(new Set());

            fetch("/api/channel/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: channel._id }),
            });
        });

        socket.on("user_typing", (user: any) => {
            if (user.id === userId) return;

            setTypingUsers((prev) => {
                if (prev.find((u) => u.id === user.id)) return prev;
                return [...prev, user];
            });
        });

        socket.on("user_stop_typing", (user: any) => {
            if (user.id === userId) return;

            setTypingUsers((prev) =>
                prev.filter((u) => u.id !== user.id)
            );
        });

        socket.on("message_seen", ({ userId }: any) => {
            setSeenUsers((prev) => {
                const updated = new Set(prev);
                updated.add(userId);
                return updated;
            });
        });

        return () => {
            socket.off("receive_message");
            socket.off("user_typing");
            socket.off("user_stop_typing");
            socket.off("message_seen");
        };
    }, [channel._id, userId]);

    // 📌 Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ✉️ Send message
    const handleSend = async () => {
        if (!content.trim() && attachments.length === 0) return;

        setLoading(true);

        const res = await fetch("/api/message/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                channelId: channel._id,
                attachments,
            }),
        });

        const data = await res.json();

        if (res.ok) {
            setContent("");
            setAttachments([]);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } else {
            alert(data.error);
        }

        setLoading(false);
    };

    if (!username) {
        return (
            <div className="p-6 text-gray-500">
                Please set your username to start chatting.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">

            <div className="border-b p-3 font-semibold">
                # {channel.name}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, index) => {

                    // 🔥 SYSTEM MESSAGE UI
                    if (msg.type === "system") {
                        return (
                            <div key={msg._id} className="flex items-center gap-3 my-3">
                                <div className="flex-1 h-px bg-gray-200" />

                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                    {msg.content}
                                </div>

                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                        );
                    }

                    // 🔥 NORMAL MESSAGE
                    return (
                        <div key={msg._id} className="text-sm">
                            <span className="font-medium">
                                {msg.sender?.username ?? "Unknown"}
                            </span>{" "}
                            {msg.content}

                            {msg.attachments?.map((att: any, i: number) => {
                                if (att.type.startsWith("image")) {
                                    return (
                                        <img
                                            key={i}
                                            src={att.url}
                                            className="max-w-xs rounded"
                                        />
                                    );
                                }

                                if (att.type.startsWith("video")) {
                                    return (
                                        <video key={i} controls className="max-w-xs">
                                            <source src={att.url} />
                                        </video>
                                    );
                                }

                                return (
                                    <a
                                        key={i}
                                        href={att.url}
                                        target="_blank"
                                        className="text-blue-500 underline"
                                    >
                                        {att.name}
                                    </a>
                                );
                            })}

                            {index === messages.length - 1 && seenUsers.size > 0 && (
                                <div className="text-xs text-gray-400">
                                    Seen by {seenUsers.size}
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="border-t p-3 flex gap-2 flex-col">

                {typingUsers.length > 0 && (
                    <div className="text-sm text-gray-500 px-3">
                        {typingUsers.length === 1
                            ? `${typingUsers[0].username} is typing...`
                            : `${typingUsers.map((u) => u.username).join(" and ")} are typing...`}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);

                            if (!userId || !username) return;

                            socketRef.current.emit("typing_start", {
                                channelId: channel._id,
                                user: { id: userId, username },
                            });

                            if (typingTimeout.current) {
                                clearTimeout(typingTimeout.current);
                            }

                            typingTimeout.current = setTimeout(() => {
                                socketRef.current.emit("typing_stop", {
                                    channelId: channel._id,
                                    user: { id: userId, username },
                                });
                            }, 1500);
                        }}
                        placeholder="Type a message..."
                        className="flex-1 border p-2 rounded"
                    />

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />

                    <button
                        disabled={loading || uploading}
                        onClick={handleSend}
                        className="bg-black text-white px-4 rounded"
                    >
                        {uploading ? "Uploading..." : loading ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
}