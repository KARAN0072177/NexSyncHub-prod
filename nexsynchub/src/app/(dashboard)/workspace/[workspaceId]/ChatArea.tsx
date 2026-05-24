// ChatArea.tsx
"use client";

import { useEffect, useState, useRef, useCallback, Fragment, useLayoutEffect } from "react";
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
    Smile,
    ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import WorkspacePresence from "@/components/chat/WorkspacePresence";

/* ─── tokens ─────────────────────────────────────────────────────────────── */
const T = {
    bg: "#03060F",
    surface: "rgba(8,16,40,0.70)",
    surfaceHi: "rgba(10,22,52,0.85)",
    border: "rgba(99,140,255,0.10)",
    borderHi: "rgba(99,140,255,0.22)",
    accent: "#3D7BFF",
    accentLo: "rgba(61,123,255,0.12)",
    accentMd: "rgba(61,123,255,0.25)",
    violet: "#7C3AED",
    violetLo: "rgba(124,58,237,0.12)",
    violetMd: "rgba(124,58,237,0.25)",
    emerald: "#10B981",
    emeraldLo: "rgba(16,185,129,0.12)",
    emeraldMd: "rgba(16,185,129,0.25)",
    rose: "#FF4D6D",
    roseLo: "rgba(255,77,109,0.12)",
    roseMd: "rgba(255,77,109,0.25)",
    text: "#E2E8F8",
    muted: "#4A5578",
};

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
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
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
        setFirstUnreadId(null);
        const fetchMessages = async () => {
            // Fetch unread count first
            const unreadRes = await fetch(`/api/channel/unread-counts?workspaceId=${channel.workspace}`);
            const unreadData = await unreadRes.json();
            const unreadCount = unreadData.unreadCounts?.[channel._id] || 0;

            const res = await fetch(`/api/message/list?channelId=${channel._id}`);
            const data = await res.json();

            if (res.ok) {
                setMessages(data.messages);
                setCursor(data.nextCursor); // ✅ IMPORTANT

                if (data.messages.length > 0) {
                    const lastMsg = data.messages[data.messages.length - 1];
                    
                    // Safely extract from possible backend field names
                    let readers = lastMsg.readBy || lastMsg.seenBy || lastMsg.viewedBy || lastMsg.readers || [];
                    if (!Array.isArray(readers) && typeof readers === "object") {
                        readers = Object.keys(readers); // Handle if backend returns a dictionary map
                    }

                    const initialSeen = new Set<string>();
                    if (Array.isArray(readers)) {
                        readers.forEach((u: any) => {
                            const id = u?._id || u?.user || u?.id || (typeof u === "string" ? u : null);
                            if (id && String(id) !== String(userId)) {
                                initialSeen.add(String(id));
                            }
                        });
                    }
                    setSeenUsers(initialSeen);
                }

                if (unreadCount > 0 && data.messages.length > 0) {
                    const firstUnreadIndex = Math.max(0, data.messages.length - unreadCount);
                    if (data.messages[firstUnreadIndex]) {
                        setFirstUnreadId(data.messages[firstUnreadIndex]._id);
                    }
                }

                // 🔥 Mark channel as read since the user just opened it!
                fetch("/api/channel/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ channelId: channel._id }),
                }).catch(err => console.error("Failed to mark channel as read:", err));
            }
        };
        fetchMessages();
    }, [channel._id, channel.workspace, userId]);

    // 🔥 Load more messages (pagination)

    const loadMoreMessages = async () => {
        if (!cursor || loadingMore) return;

        setLoadingMore(true);

        const container = messagesContainerRef.current;

        const res = await fetch(
            `/api/message/list?channelId=${channel._id}&cursor=${cursor}`
        );

        const data = await res.json();

        if (res.ok) {
            if (container) {
                prevScrollRef.current = {
                    scrollHeight: container.scrollHeight,
                    scrollTop: container.scrollTop,
                };
            }
            setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m._id));

                const newMessages = data.messages.filter(
                    (m: any) => !existingIds.has(m._id)
                );

                return [...newMessages, ...prev];
            });
            setCursor(data.nextCursor);
        }

        setLoadingMore(false);
    };

    // 🔥 Maintain scroll position smoothly before browser repaints
    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (container && prevScrollRef.current) {
            const heightDiff = container.scrollHeight - prevScrollRef.current.scrollHeight;
            container.scrollTop = prevScrollRef.current.scrollTop + heightDiff;
            prevScrollRef.current = null;
        }
    }, [messages]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop === 0) {
                loadMoreMessages();
            }

            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
            setShowScrollBottom(!isNearBottom);
        };

        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [cursor, loadingMore]);

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

        socket.on(
            "receive_message",
            (msg: any) => {

                const isCurrentChannel =
                    String(msg.channel) ===
                    String(channel._id);

                // 🔥 Different channel
                if (!isCurrentChannel) {

                    window.dispatchEvent(
                        new CustomEvent(
                            "channel-unread",
                            {
                                detail: {
                                    channelId:
                                        msg.channel,
                                },
                            }
                        )
                    );

                    return;
                }

                // 🔥 Current channel
                setMessages((prev) => {

                    if (
                        prev.some(
                            (m) =>
                                m._id === msg._id
                        )
                    ) {
                        return prev;
                    }

                    return [
                        ...prev,
                        msg,
                    ];

                });

                setSeenUsers(new Set());

                fetch(
                    "/api/channel/read",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            channelId:
                                channel._id,
                        }),
                    }
                );

            }
        );

        socket.on(
            "user_typing",
            ({
                user,
                channelId,
            }: any) => {

                if (
                    String(channelId) !==
                    String(channel._id)
                ) {
                    return;
                }

                if (user.id === userId)
                    return;

                setTypingUsers((prev) => {

                    if (
                        prev.find(
                            (u) =>
                                u.id === user.id
                        )
                    ) {
                        return prev;
                    }

                    return [
                        ...prev,
                        user,
                    ];

                });

            }
        );

        socket.on(
            "user_stop_typing",
            ({
                user,
                channelId,
            }: any) => {

                if (
                    String(channelId) !==
                    String(channel._id)
                ) {
                    return;
                }

                if (user.id === userId)
                    return;

                setTypingUsers((prev) =>
                    prev.filter(
                        (u) =>
                            u.id !== user.id
                    )
                );

            }
        );

        socket.on("message_seen", (payload: any) => {
            const seenId = payload?.userId || payload?.user || payload;
            if (!seenId || String(seenId) === String(userId)) return;
            setSeenUsers((prev) => new Set(prev).add(String(seenId)));
        });

        socket.on("message_reaction_update", ({ messageId, reactions }: any) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    String(msg._id) !== String(messageId)
                        ? msg
                        : { ...msg, reactions }
                )
            );
        });

        return () => {

            // 🔥 Cleanup listeners on unmount or channel change

            socket.off("receive_message"); // message cleanup
            socket.off("user_typing"); // typing cleanup
            socket.off("user_stop_typing");  // stop typing cleanup
            socket.off("message_seen"); // seen cleanup
            socket.off("message_reaction_update"); // reaction cleanup 
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

    // 🔥 Handle reactions

    const handleReaction = async (
        messageId: string,
        emoji: string
    ) => {

        try {
            const msg = messages.find((m) => String(m._id) === String(messageId));
            
            if (msg?.reactions) {
                // Find if the user has already reacted with a different emoji
                const existingReaction = msg.reactions.find((r: any) =>
                    r.users?.some(
                        (id: any) =>
                            String(typeof id === "object" ? id._id || id.id : id) === String(userId)
                    )
                );

                // If they have an existing reaction and it's different from the new one, remove the old one first
                if (existingReaction && existingReaction.emoji !== emoji) {
                    await fetch("/api/message/react", {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            messageId,
                            emoji: existingReaction.emoji,
                        }),
                    });
                }
            }

            await fetch(
                "/api/message/react",
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        messageId,
                        emoji,
                    }),
                }
            );

        } catch (err) {

            console.error(
                "REACTION ERROR:",
                err
            );

        }

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

            // Initialize seenUsers for the loaded context's last message
            if (data.messages.length > 0) {
                const lastMsg = data.messages[data.messages.length - 1];
                
                // Safely extract from possible backend field names
                let readers = lastMsg.readBy || lastMsg.seenBy || lastMsg.viewedBy || lastMsg.readers || [];
                if (!Array.isArray(readers) && typeof readers === "object") {
                    readers = Object.keys(readers); // Handle if backend returns a dictionary map
                }

                const initialSeen = new Set<string>();
                if (Array.isArray(readers)) {
                    readers.forEach((u: any) => {
                        const id = u?._id || u?.user || u?.id || (typeof u === "string" ? u : null);
                        if (id && String(id) !== String(userId)) {
                            initialSeen.add(String(id));
                        }
                    });
                }
                setSeenUsers(initialSeen);
            }

            // 🔥 Stop pagination (optional but recommended)
            setCursor(null);

            // 🔥 Mark channel as read when deep linking
            fetch("/api/channel/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId: channel._id }),
            }).catch(err => console.error("Failed to mark channel as read:", err));

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

    const getReactionUsernames = useCallback((userIds: any[]) => {
        if (!userIds || userIds.length === 0) return [];
        const usernames = userIds.map((id: any) => {
            const uId = typeof id === "object" ? id._id || id.id : id;
            if (String(uId) === String(userId)) return "You";
            const member = members.find((m) => String(m.user._id) === String(uId));
            return member?.user?.username || "Someone";
        });
        return usernames;
    }, [members, userId]);

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    if (!username) {
        return (
            <div className="flex items-center justify-center h-full" style={{ background: T.bg }}>
                <div className="text-center p-10 rounded-[2rem] backdrop-blur-xl shadow-2xl" style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}` }}>
                    <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                        <Users className="w-8 h-8" style={{ color: T.muted }} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: T.muted, fontFamily: "'DM Sans',sans-serif" }}>Please set your username to start chatting.</p>
                </div>
            </div>
        );
    }

    if (!channel || !channel._id) {
        return (
            <div className="flex items-center justify-center h-full" style={{ background: T.bg }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}` }}>
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full" style={{ background: T.bg }}>
            {/* Header */}
            <div className="relative z-50 flex-shrink-0 px-5 py-4 backdrop-blur-xl shadow-sm"
                 style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.borderHi}` }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: T.accentLo, border: `1px solid ${T.accentMd}` }}>
                        <span className="font-bold text-lg leading-none" style={{ color: T.accent, fontFamily: "'Sora',sans-serif" }}>#</span>
                    </div>
                    <h2 className="font-bold text-white tracking-tight text-lg" style={{ fontFamily: "'Sora',sans-serif" }}>{channel.name}</h2>
                    <div className="ml-auto">
                        <WorkspacePresence
                            socket={socketRef.current}
                            workspaceId={channel.workspace}
                            members={members}
                            currentUserId={userId}
                        />
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 relative min-h-0">
                <div
                    ref={messagesContainerRef}
                    className="h-full overflow-y-auto overflow-x-hidden px-5 py-6 space-y-6 scrollbar-thin"
                    style={{ background: T.bg }}
                >

                {/* Loading more indicator */}

                {loadingMore && (
                    <div className="flex justify-center mb-2">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: T.accent }} />
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isOwnMessage = msg.sender?._id === userId || msg.sender === userId;
                    const showSeen = index === messages.length - 1 && seenUsers.size > 0 && isOwnMessage;
                    const showUnreadBanner = firstUnreadId === msg._id;

                    // System message
                    if (msg.type === "system") {
                        return (
                            <div key={msg._id} className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.borderHi}, transparent)` }} />
                                <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                                     style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.muted }}>
                                    {msg.content}
                                </div>
                                <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.borderHi}, transparent)` }} />
                            </div>
                        );
                    }

                    return (
                        <Fragment key={msg._id}>
                            {showUnreadBanner && (
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.roseMd}, transparent)` }} />
                                    <div className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg"
                                         style={{ background: T.roseLo, border: `1px solid ${T.roseMd}`, color: T.rose }}>
                                        New Messages
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${T.roseMd}, transparent)` }} />
                                </div>
                            )}
                            <div
                                id={`msg-${msg._id}`}
                                className={`flex relative w-full ${isOwnMessage ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`group relative w-fit max-w-[85%] md:max-w-[70%] transition-all duration-300 ${activeHighlight === msg._id
                                    ? "scale-[1.02]"
                                        : ""
                                        }`}
                                style={activeHighlight === msg._id ? { boxShadow: `0 0 0 2px ${T.violet}, 0 0 40px ${T.violetLo}` } : {}}
                                >
                                    {/* Message bubble */}
                                    <div
                                        className={`px-5 py-3.5 shadow-sm backdrop-blur-sm ${isOwnMessage ? "rounded-[1.5rem] rounded-br-sm" : "rounded-[1.5rem] rounded-bl-sm"}`}
                                        style={{
                                            background: isOwnMessage ? T.accentLo : T.surface,
                                            border: `1px solid ${isOwnMessage ? T.accentMd : T.border}`,
                                            color: T.text,
                                        }}
                                    >
                                        {!isOwnMessage && (
                                            <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: T.accent }}>
                                                {msg.sender?.username ?? "Unknown"}
                                            </p>
                                        )}
                                        <p className="text-[15px] leading-[1.6] whitespace-pre-wrap break-words" style={{ fontFamily: "'DM Sans',sans-serif" }}>{msg.content}</p>

                                        {/* Reactions */}
                                        {msg.reactions?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">

                                                {msg.reactions.map((reaction: any, index: number) => {

                                                    const reacted =
                                                        reaction.users?.some(
                                                            (id: any) =>
                                                                String(typeof id === "object" ? id._id || id.id : id) === String(userId)
                                                        );

                                                    return (
                                                        <div key={index} className="relative group/reaction">
                                                            <button
                                                                onClick={() =>
                                                                    handleReaction(
                                                                        msg._id,
                                                                        reaction.emoji
                                                                    )
                                                                }
                                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm`}
                                                                style={{
                                                                    background: reacted ? T.accentLo : "rgba(255,255,255,0.03)",
                                                                    border: `1px solid ${reacted ? T.accentMd : T.border}`,
                                                                    color: reacted ? T.accent : T.muted
                                                                }}
                                                                onMouseEnter={(e) => { if (!reacted) { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; } }}
                                                                onMouseLeave={(e) => { if (!reacted) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; } }}
                                                            >
                                                                <span>{reaction.emoji}</span>
                                                                {reaction.users?.length > 0 && <span>{reaction.users.length}</span>}
                                                            </button>
                                                            
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[11px] rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/reaction:opacity-100 transition-all duration-200 z-[100] backdrop-blur-md flex flex-col gap-1.5"
                                                                 style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}` }}>
                                                                {getReactionUsernames(reaction.users).map((uname: string, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between gap-3">
                                                                        <span className="font-bold text-white">{uname}</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span style={{ color: T.muted }}>:</span>
                                                                            <span>{reaction.emoji}</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );

                                                })}

                                            </div>
                                        )}

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
                                                                    className="max-w-full rounded-xl"
                                                                    style={{ border: `1px solid ${T.borderHi}` }}
                                                            />
                                                        );
                                                    }
                                                    if (att.type?.startsWith("video")) {
                                                        return (
                                                                <video key={i} controls className="max-w-full rounded-xl" style={{ border: `1px solid ${T.borderHi}` }}>
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
                                                                className="flex items-center gap-2.5 p-3 rounded-xl transition-all"
                                                                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
                                                        >
                                                                <File size={16} style={{ color: T.accent }} />
                                                                <span className="text-sm font-semibold truncate" style={{ color: T.text }}>{att.name}</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Seen indicator */}
                                    {showSeen && (
                                        <div className="flex items-center justify-end gap-1 mt-1.5 text-[11px]" style={{ color: T.muted }}>
                                            <CheckCheck size={12} style={{ color: T.emerald }} />
                                            <span>Seen by {seenUsers.size}</span>
                                        </div>
                                    )}

                                    {/* Hover Actions Toolbar */}
                                    <div className={`absolute -top-6 ${isOwnMessage ? "right-0" : "left-0"} opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center z-10 translate-y-2 group-hover:translate-y-0`}>
                                        <div className="flex items-center rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl" style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}` }}>
                                            {/* Quick reactions */}
                                            <div className="flex items-center px-1.5 py-1">
                                                {["👍", "❤️", "🔥", "😂"].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg._id, emoji)}
                                                        className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-[15px] transition-colors"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <div className="w-px h-5 mx-1" style={{ background: T.borderHi }} />
                                            
                                            {/* Convert to Task button */}
                                            <button
                                                onClick={() => openTaskModal(msg)}
                                                className="px-3.5 h-10 text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap hover:bg-white/5"
                                                title="Convert to Task"
                                                style={{ color: T.muted }}
                                            >
                                                <Flag size={12} />
                                                Task
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Fragment>
                    );
                })}
                <div ref={bottomRef} />
                </div>

                {/* Scroll to Bottom Button */}
                {showScrollBottom && (
                    <button
                        onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                        className="absolute bottom-6 right-6 p-3 rounded-full shadow-2xl transition-all z-20 group backdrop-blur-xl"
                        style={{ background: T.surfaceHi, border: `1px solid ${T.borderHi}`, color: T.text }}
                    >
                        <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                    </button>
                )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-5 backdrop-blur-xl z-10" style={{ background: T.surfaceHi, borderTop: `1px solid ${T.borderHi}` }}>
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="mb-2 px-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                            <Loader2 size={12} className="animate-spin" style={{ color: T.accent }} />
                            <span className="text-[11px] font-bold tracking-wide" style={{ color: T.muted }}>
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
                                className="relative group rounded-xl p-2.5 flex items-center gap-2.5 backdrop-blur-md shadow-sm"
                                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}
                            >
                                {att.type === "image" ? (
                                    <ImageIcon size={16} style={{ color: T.accent }} />
                                ) : att.type === "video" ? (
                                    <File size={16} style={{ color: T.accent }} />
                                ) : (
                                    <File size={16} style={{ color: T.muted }} />
                                )}
                                <span className="text-xs font-semibold max-w-[150px] truncate" style={{ color: T.text }}>{att.name}</span>
                                <span className="text-[10px] font-bold" style={{ color: T.muted }}>{formatFileSize(att.size)}</span>
                                <button
                                    onClick={() => removeAttachment(idx)}
                                    className="ml-1 p-1 hover:bg-white/10 rounded-md transition-colors"
                                >
                                    <X size={12} style={{ color: T.muted }} className="hover:text-red-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

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
                            className="w-full rounded-2xl px-5 py-4 pr-12 text-[15px] focus:outline-none transition-all resize-none shadow-inner"
                            style={{
                                background: "rgba(0,0,0,0.25)",
                                border: `1px solid ${T.borderHi}`,
                                color: T.text,
                                fontFamily: "'DM Sans',sans-serif"
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentLo}`; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.boxShadow = "none"; }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute right-3 top-3.5 p-1.5 rounded-xl transition-colors"
                            style={{ color: T.muted }}
                            onMouseEnter={e => { e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentLo; }}
                            onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = "transparent"; }}
                        >
                            <Paperclip size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={loading || uploading}
                        onClick={handleSend}
                        className="flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 transition-all flex items-center gap-2 shadow-xl font-bold"
                        style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.violet})`, boxShadow: `0 8px 24px ${T.accentLo}` }}
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
                    </motion.button>
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