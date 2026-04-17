// ChatArea.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
    Send,
    Paperclip,
    X,
    Image as ImageIcon,
    File,
    Loader2,
    CheckCheck,
    Users,
    MoreVertical,
    Flag,
    User,
} from "lucide-react";

type Attachment = {
    key: string;
    type: "image" | "video" | "file";
    name?: string;
    size?: number;
};

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
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [assignee, setAssignee] = useState("");
    const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [cursor, setCursor] = useState<string | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { data: session } = useSession();

    const userId = session?.user?.id;
    const username = session?.user?.username;

    const searchParams = useSearchParams();
    const highlightMessageId = searchParams.get("message");

    // 🔥 INIT SOCKET (ONLY ONCE)
    useEffect(() => {
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL!);
        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    // 🔥 HANDLE HIGHLIGHT
    useEffect(() => {
        if (!highlightMessageId) return;

        const targetExists = messages.some(
            (m) => m._id === highlightMessageId
        );

        if (!targetExists) return; // ⛔ wait until message is loaded

        setTimeout(() => {
            const el = document.getElementById(`msg-${highlightMessageId}`);

            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                setActiveHighlight(highlightMessageId);

                const timer = setTimeout(() => setActiveHighlight(null), 3000);
                return () => clearTimeout(timer);
            }
        }, 100);

    }, [messages, highlightMessageId]);

    // 📩 Fetch messages
    useEffect(() => {
        if (!channel?._id) return;
        const fetchMessages = async () => {
            const res = await fetch(`/api/message/list?channelId=${channel._id}`);
            const data = await res.json();

            if (res.ok) {
                setMessages(data.messages);
                setCursor(data.nextCursor); // ✅ IMPORTANT
            }
        };
        fetchMessages();
    }, [channel._id]);

    // 🔥 Load more messages (pagination)

    const loadMoreMessages = async () => {
        if (!cursor || loadingMore) return;

        setLoadingMore(true);

        const container = messagesContainerRef.current;
        const prevHeight = container?.scrollHeight || 0;

        const res = await fetch(
            `/api/message/list?channelId=${channel._id}&cursor=${cursor}`
        );

        const data = await res.json();

        if (res.ok) {
            setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m._id));

                const newMessages = data.messages.filter(
                    (m: any) => !existingIds.has(m._id)
                );

                return [...newMessages, ...prev];
            });
            setCursor(data.nextCursor);
        }

        // 🔥 Maintain scroll position
        setTimeout(() => {
            if (container) {
                const newHeight = container.scrollHeight;
                container.scrollTop = newHeight - prevHeight;
            }
        }, 0);

        setLoadingMore(false);
    };


    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0) {
                loadMoreMessages();
            }
        };

        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [cursor, loadingMore]);

    // 🔥 Mark read
    useEffect(() => {
        if (!channel?._id) return;
        const markRead = () => {
            fetch("/api/channel/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: channel._id }),
            });
        };
        markRead();
        window.addEventListener("focus", markRead);
        return () => window.removeEventListener("focus", markRead);
    }, [channel._id]);

    // 👥 Fetch members
    useEffect(() => {
        const fetchMembers = async () => {
            const res = await fetch(`/api/workspace/members?workspaceId=${channel.workspace}`);
            const data = await res.json();
            if (res.ok) setMembers(data.members);
        };
        if (channel?.workspace) fetchMembers();
    }, [channel?.workspace]);

    // 🔥 FILE UPLOAD
    const handleFileUpload = async (e: any) => {
        if (uploading) {
            alert("Please wait for upload to finish");
            return;
        }
        const files = e.target.files;
        if (!files.length) return;
        setUploading(true);
        const uploadedFiles: Attachment[] = [];
        for (let file of files) {
            const res = await fetch("/api/upload-url", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: file.name, fileType: file.type }),
            });
            const { uploadUrl, key } = await res.json();
            await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            let fileType: "image" | "video" | "file" = "file";
            if (file.type.startsWith("image")) fileType = "image";
            else if (file.type.startsWith("video")) fileType = "video";
            uploadedFiles.push({ key, type: fileType, name: file.name, size: file.size });
        }
        setAttachments((prev) => [...prev, ...uploadedFiles]);
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    // 🔥 SOCKET LISTENERS
    useEffect(() => {
        if (!channel?._id || !socketRef.current) return;
        const socket = socketRef.current;
        socket.emit("join_channel", channel._id);

        socket.on("receive_message", (msg: any) => {
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
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
            setTypingUsers((prev) => prev.filter((u) => u.id !== user.id));
        });

        socket.on("message_seen", ({ userId }: any) => {
            setSeenUsers((prev) => new Set(prev).add(userId));
        });

        return () => {
            socket.off("receive_message");
            socket.off("user_typing");
            socket.off("user_stop_typing");
            socket.off("message_seen");
        };
    }, [channel._id, userId]);

    // 📌 Auto scroll to bottom (only if already near bottom)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // 🔥 Open task modal
    const openTaskModal = (msg: any) => {
        if (!msg) return;
        setSelectedMessage({ ...msg, priority: "medium" });
        setShowTaskModal(true);
    };

    // 🔥 Create task from message
    const handleCreateTask = async () => {
        if (!selectedMessage || !channel) return;
        const res = await fetch("/api/task/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: selectedMessage.content,
                workspaceId: channel.workspace,
                channelId: channel._id,
                priority: selectedMessage.priority,
                linkedMessage: selectedMessage?._id,
                assignee: assignee || undefined,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error);
            return;
        }
        setShowTaskModal(false);
    };

    // ✉️ Send message
    const handleSend = async () => {
        if (!content.trim() && attachments.length === 0) return;
        setLoading(true);
        const res = await fetch("/api/message/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, channelId: channel._id, attachments }),
        });
        const data = await res.json();
        if (res.ok) {
            setContent("");
            setAttachments([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
            alert(data.error);
        }
        setLoading(false);
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (!userId || !username) return;
        socketRef.current.emit("typing_start", {
            channelId: channel._id,
            user: { id: userId, username },
        });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socketRef.current.emit("typing_stop", {
                channelId: channel._id,
                user: { id: userId, username },
            });
        }, 1500);
    };


    // 🔥 Load messages until target message is found (for deep linking)

    const loadMessageContext = async (messageId: string) => {
        try {
            const res = await fetch(
                `/api/message/context?messageId=${messageId}`
            );

            const data = await res.json();

            if (!res.ok) return;

            // 🔥 Replace messages completely
            setMessages(data.messages);

            // 🔥 Stop pagination (optional but recommended)
            setCursor(null);

        } catch (err) {
            console.error("Context load failed:", err);
        }
    };

    // useEffect for loading message context when highlightMessageId changes

    useEffect(() => {
        if (!highlightMessageId || !channel?._id) return;

        console.log("🔥 Loading message context...");

        loadMessageContext(highlightMessageId);

    }, [highlightMessageId]);

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!username) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <div className="text-center p-8 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Please set your username to start chatting.</p>
                </div>
            </div>
        );
    }

    if (!channel || !channel._id) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <span className="text-indigo-400 font-bold text-lg">#</span>
                    </div>
                    <h2 className="font-semibold text-gray-200 tracking-tight">{channel.name}</h2>
                    <span className="ml-auto text-xs text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-full border border-gray-700/50">
                        {members.length} members
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
            >

                {/* Loading more indicator */}

                {loadingMore && (
                    <div className="flex justify-center mb-2">
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isOwnMessage = msg.sender?._id === userId || msg.sender === userId;
                    const showSeen = index === messages.length - 1 && seenUsers.size > 0 && isOwnMessage;

                    // System message
                    if (msg.type === "system") {
                        return (
                            <div key={msg._id} className="flex items-center gap-3 my-2">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800">
                                    {msg.content}
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg._id}
                            id={`msg-${msg._id}`}
                            className={`group relative flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[75%] transition-all duration-300 ${activeHighlight === msg._id
                                    ? "ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/10 scale-[1.02]"
                                    : ""
                                    }`}
                            >
                                {/* Message bubble */}
                                <div
                                    className={`rounded-2xl px-4 py-2.5 ${isOwnMessage
                                        ? "bg-indigo-600/20 border border-indigo-500/30 text-gray-200"
                                        : "bg-gray-800/80 border border-gray-700 text-gray-200"
                                        }`}
                                >
                                    {!isOwnMessage && (
                                        <p className="text-xs font-medium text-indigo-400 mb-1">
                                            {msg.sender?.username ?? "Unknown"}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>

                                    {/* Attachments */}
                                    {msg.attachments?.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {msg.attachments.map((att: any, i: number) => {
                                                if (att.type?.startsWith("image")) {
                                                    return (
                                                        <img
                                                            key={i}
                                                            src={att.url}
                                                            alt="attachment"
                                                            className="max-w-full rounded-lg border border-gray-700"
                                                        />
                                                    );
                                                }
                                                if (att.type?.startsWith("video")) {
                                                    return (
                                                        <video key={i} controls className="max-w-full rounded-lg border border-gray-700">
                                                            <source src={att.url} />
                                                        </video>
                                                    );
                                                }
                                                return (
                                                    <a
                                                        key={i}
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg border border-gray-700 text-indigo-400 hover:text-indigo-300 transition-colors"
                                                    >
                                                        <File size={14} />
                                                        <span className="text-sm truncate">{att.name}</span>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Seen indicator */}
                                {showSeen && (
                                    <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-500">
                                        <CheckCheck size={12} className="text-green-500" />
                                        <span>Seen by {seenUsers.size}</span>
                                    </div>
                                )}
                            </div>

                            {/* Convert to Task button (hover) */}
                            <button
                                onClick={() => openTaskModal(msg)}
                                className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 
                  bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-indigo-600/30 
                  hover:border-indigo-500/50 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5 shadow-lg"
                            >
                                <Flag size={12} />
                                Convert to Task
                            </button>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="mb-2 px-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full border border-gray-700/50">
                            <Loader2 size={12} className="text-indigo-400 animate-spin" />
                            <span className="text-xs text-gray-400">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].username} is typing...`
                                    : `${typingUsers.map((u) => u.username).join(", ")} are typing...`}
                            </span>
                        </div>
                    </div>
                )}

                {/* Attachment previews */}
                {attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {attachments.map((att, idx) => (
                            <div
                                key={idx}
                                className="relative group bg-gray-800/80 border border-gray-700 rounded-lg p-2 flex items-center gap-2"
                            >
                                {att.type === "image" ? (
                                    <ImageIcon size={16} className="text-indigo-400" />
                                ) : att.type === "video" ? (
                                    <File size={16} className="text-indigo-400" />
                                ) : (
                                    <File size={16} className="text-gray-400" />
                                )}
                                <span className="text-xs text-gray-300 max-w-[150px] truncate">{att.name}</span>
                                <span className="text-xs text-gray-500">{formatFileSize(att.size)}</span>
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="ml-1 p-0.5 hover:bg-red-500/20 rounded transition-colors"
                                >
                                    <X size={12} className="text-gray-400 hover:text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input row */}
                {/* Input row */}
                <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={content}
                            onChange={handleTyping}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 pr-12
        text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
        focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute right-3 top-3 text-gray-400 hover:text-indigo-400 transition-colors"
                        >
                            <Paperclip size={18} />
                        </button>
                    </div>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        disabled={loading || uploading}
                        onClick={handleSend}
                        className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 
      disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 transition-colors
      flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Uploading
                            </>
                        ) : loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <>
                                <Send size={16} />
                                Send
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Task Modal */}
            {showTaskModal && selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowTaskModal(false)}
                    />
                    <div className="relative bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-indigo-400" />
                            Convert to Task
                        </h2>

                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Title</label>
                                <input
                                    value={selectedMessage.content || ""}
                                    onChange={(e) =>
                                        setSelectedMessage({ ...selectedMessage, content: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                    text-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-indigo-500/50 
                    focus:border-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Priority</label>
                                <select
                                    value={selectedMessage.priority || "medium"}
                                    onChange={(e) =>
                                        setSelectedMessage({ ...selectedMessage, priority: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                    text-gray-200 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            {/* Assignee */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                    Assignee (optional)
                                </label>
                                <select
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5
                    text-gray-200 focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((m) => (
                                        <option key={m.user._id} value={m.user._id}>
                                            {m.user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowTaskModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 
                  transition-colors border border-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTask}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white 
                  transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                            >
                                <Flag size={14} />
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}