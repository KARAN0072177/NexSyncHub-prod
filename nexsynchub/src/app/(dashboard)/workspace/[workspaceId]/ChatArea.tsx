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
    CheckCircle2,
    XCircle,
    Mail,
    CalendarDays,
    BadgeCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import WorkspacePresence from "@/components/chat/WorkspacePresence";

type Attachment = {
    key: string;
    url: string;
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
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionIndex, setMentionIndex] = useState<number>(0);
    const [filteredMentions, setFilteredMentions] = useState<any[]>([]);
    const [hoveredMention, setHoveredMention] = useState<{
        member: any;
        left: number;
        top?: number;
        bottom?: number;
        maxHeight: number;
        placement: "top" | "bottom";
    } | null>(null);
    const [hoveringReactionDetails, setHoveringReactionDetails] = useState(false);
    const mentionHoverTimeout = useRef<any>(null);

    const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" | null }>({ show: false, message: "", type: null });

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 4000);
    };

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

    useEffect(() => {
        return () => {
            if (mentionHoverTimeout.current) {
                clearTimeout(mentionHoverTimeout.current);
            }
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
            setHoveredMention(null);
            setHoveringReactionDetails(false);

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
            showToast("Please wait for upload to finish", "error");
            return;
        }
        const files = e.target.files;
        if (!files.length) return;
        setUploading(true);
        const uploadedFiles: Attachment[] = [];
        for (let file of files) {

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            const res =
                await fetch(
                    "/api/upload",
                    {

                        method: "POST",

                        body: formData,

                    }
                );

            const data =
                await res.json();

            if (!res.ok) {

                showToast(
                    data.error ||
                    "Upload failed",
                    "error"
                );

                continue;

            }

            uploadedFiles.push({

                key:
                    data.key,

                url:
                    data.url,

                type:
                    data.type,

                name:
                    data.name,

                size:
                    data.size,

            });

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
            showToast(data.error || "Failed to create task", "error");
            return;
        }
        showToast("Task created successfully!", "success");
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
            showToast(data.error || "Failed to send message", "error");
        }
        setLoading(false);
    };

    const handleTyping = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {

        const value = e.target.value;

        setContent(value);

        // ===================================
        // 🔥 MENTION DETECTION
        // ===================================

        const cursorPos =
            e.target.selectionStart ?? value.length;

        const textBeforeCursor =
            value.slice(0, cursorPos);

        const mentionMatch =
            textBeforeCursor.match(
                /@([a-zA-Z0-9_]*)$/
            );

        if (mentionMatch) {

            const query =
                mentionMatch[1].toLowerCase();

            setMentionQuery(query);

            const filtered =
                members.filter((m) =>
                    m.user.username
                        ?.toLowerCase()
                        .includes(query)
                );

            setFilteredMentions(filtered);

            setShowMentions(
                filtered.length > 0
            );

            setMentionIndex(0);

        } else {

            setShowMentions(false);

        }

        // ===================================
        // 🔥 SOCKET TYPING
        // ===================================

        if (!userId || !username)
            return;

        socketRef.current.emit(
            "typing_start",
            {
                channelId: channel._id,
                user: {
                    id: userId,
                    username,
                },
            }
        );

        if (typingTimeout.current)
            clearTimeout(
                typingTimeout.current
            );

        typingTimeout.current =
            setTimeout(() => {

                socketRef.current.emit(
                    "typing_stop",
                    {
                        channelId: channel._id,
                        user: {
                            id: userId,
                            username,
                        },
                    }
                );

            }, 1500);

    };

    const selectMention = (
        username: string
    ) => {

        const newContent =
            content.replace(
                /@([a-zA-Z0-9_]*)$/,
                `@${username} `
            );

        setContent(newContent);

        setShowMentions(false);

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

    const getMentionedMember = (mentionedUsername: string) => {
        return members.find(
            (member) =>
                member.user?.username?.toLowerCase() ===
                mentionedUsername.toLowerCase()
        );
    };

    const formatJoinedDate = (date?: string) => {
        if (!date) return "";

        return new Date(date).toLocaleDateString(undefined, {
            month: "short",
            year: "numeric",
        });
    };

    const openMentionProfile = (
        member: any,
        element: HTMLElement
    ) => {
        if (mentionHoverTimeout.current) {
            clearTimeout(mentionHoverTimeout.current);
        }

        const bubble =
            element.closest("[data-message-bubble]") as HTMLElement | null;
        const rect = (bubble || element).getBoundingClientRect();
        const cardWidth = 320;
        const viewportPadding = 12;
        const gap = 10;
        const left = Math.min(
            Math.max(
                rect.left + rect.width / 2 - cardWidth / 2,
                viewportPadding
            ),
            window.innerWidth - cardWidth - viewportPadding
        );
        const spaceAbove = rect.top - gap - viewportPadding;
        const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
        const hasSpaceAbove = spaceAbove >= 220 || spaceAbove >= spaceBelow;

        setHoveredMention({
            member,
            left,
            top: hasSpaceAbove ? undefined : rect.bottom + gap,
            bottom: hasSpaceAbove
                ? window.innerHeight - rect.top + gap
                : undefined,
            maxHeight: Math.max(
                180,
                hasSpaceAbove ? spaceAbove : spaceBelow
            ),
            placement: hasSpaceAbove ? "top" : "bottom",
        });
    };

    const closeMentionProfile = () => {
        if (mentionHoverTimeout.current) {
            clearTimeout(mentionHoverTimeout.current);
        }

        mentionHoverTimeout.current = setTimeout(() => {
            setHoveredMention(null);
        }, 120);
    };

    const keepMentionProfileOpen = () => {
        if (mentionHoverTimeout.current) {
            clearTimeout(mentionHoverTimeout.current);
        }
    };

    const renderMessageContent = (content: string) => {
        if (!content) return null;

        const parts = content.split(/(@[a-zA-Z0-9_]+)/g);

        return parts.map((part, index) => {
            if (part.startsWith('@')) {
                const mentionedUsername = part.substring(1);
                const mentionedMember = getMentionedMember(mentionedUsername);
                const mentionedUser = mentionedMember?.user;
                const displayName = mentionedUser?.displayName || mentionedUser?.username;
                const isCurrentUserMention =
                    mentionedUsername.toLowerCase() === username?.toLowerCase();

                if (!mentionedMember) {
                    return (
                        <span
                            key={index}
                            className={`font-medium rounded px-1 py-0.5 ${isCurrentUserMention
                                ? "text-yellow-300"
                                : "text-indigo-400"
                                }`}
                        >
                            {part}
                        </span>
                    );
                }

                return (
                    <span
                        key={index}
                        className="inline-flex align-baseline"
                    >
                        <span
                            onMouseEnter={(event) =>
                                openMentionProfile(
                                    mentionedMember,
                                    event.currentTarget
                                )
                            }
                            onMouseLeave={closeMentionProfile}
                            onFocus={(event) =>
                                openMentionProfile(
                                    mentionedMember,
                                    event.currentTarget
                                )
                            }
                            onBlur={closeMentionProfile}
                            tabIndex={0}
                            className={`font-medium rounded px-1 py-0.5 cursor-default transition-colors ${isCurrentUserMention
                                ? "text-yellow-300"
                                : "text-indigo-400 hover:bg-indigo-500/20 cursor-pointer"
                                }`}
                        >
                            {part}
                        </span>
                    </span>
                );
            }
            return <Fragment key={index}>{part}</Fragment>;
        });
    };

    const renderHoveredMentionProfile = () => {
        if (!hoveredMention) return null;

        const mentionedUser = hoveredMention.member.user;
        const displayName = mentionedUser?.displayName || mentionedUser?.username || "Unknown user";
        const initials = displayName
            .slice(0, 2)
            .toUpperCase();
        const roleLabel = String(hoveredMention.member.role || "member").toLowerCase();

        return (
            <motion.div
                key={mentionedUser?._id || mentionedUser?.username}
                initial={{ opacity: 0, y: hoveredMention.placement === "top" ? 8 : -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: hoveredMention.placement === "top" ? 8 : -8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onMouseEnter={keepMentionProfileOpen}
                onMouseLeave={closeMentionProfile}
                style={{
                    left: hoveredMention.left,
                    top: hoveredMention.top,
                    bottom: hoveredMention.bottom,
                    maxHeight: hoveredMention.maxHeight,
                }}
                className="fixed z-[3000] w-80 overflow-hidden rounded-2xl border border-gray-700/70 bg-gray-950/95 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl"
            >
                <div className="relative h-16 overflow-hidden bg-gray-900">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/45 via-sky-500/20 to-emerald-400/25" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent" />
                    <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-100 backdrop-blur-md">
                        {roleLabel}
                    </div>
                </div>

                <div className="max-h-[calc(100vh-88px)] overflow-y-auto px-4 py-4">
                    <div className="mb-4 flex items-center gap-3">
                        {mentionedUser?.avatar ? (
                            <img
                                src={mentionedUser.avatar}
                                alt={displayName}
                                className="h-14 w-14 shrink-0 rounded-2xl border border-gray-700 object-cover shadow-lg"
                            />
                        ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600 text-xl font-semibold text-white shadow-lg">
                                {initials}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <h3 className="min-w-0 truncate text-base font-semibold leading-6 text-white">
                                    {displayName}
                                </h3>
                                <BadgeCheck size={15} className="shrink-0 text-indigo-300" />
                            </div>
                            <div className="truncate text-xs leading-5 text-gray-400">
                                @{mentionedUser?.username}
                            </div>
                        </div>
                    </div>

                    <div className="mb-3 rounded-xl border border-gray-800 bg-gray-900/45 px-3 py-2.5">
                        {mentionedUser?.bio ? (
                            <p className="line-clamp-3 text-xs leading-5 text-gray-300">
                                {mentionedUser.bio}
                            </p>
                        ) : (
                            <p className="text-xs leading-5 text-gray-500">
                                No bio added yet.
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        {mentionedUser?.email && (
                            <div className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs text-gray-300 transition-colors hover:bg-gray-900/70">
                                <Mail size={14} className="shrink-0 text-gray-500" />
                                <span className="min-w-0 truncate">{mentionedUser.email}</span>
                            </div>
                        )}

                        {mentionedUser?.createdAt && (
                            <div className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs text-gray-400">
                                <CalendarDays size={14} className="shrink-0 text-gray-500" />
                                <span>Joined {formatJoinedDate(mentionedUser.createdAt)}</span>
                            </div>
                        )}

                        <div className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs text-gray-400">
                            <User size={14} className="shrink-0 text-gray-500" />
                            <span className="capitalize">
                                Workspace {roleLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
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
            <div className="relative z-50 flex-shrink-0 px-5 py-4 border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/30">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <span className="text-indigo-400 font-bold text-lg">#</span>
                    </div>
                    <h2 className="font-semibold text-gray-200 tracking-tight">{channel.name}</h2>
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
                    className="h-full overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
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
                        const showUnreadBanner = firstUnreadId === msg._id;
                        const hasReactions = msg.reactions?.length > 0;

                        // System message
                        if (msg.type === "system" || msg.type === "task_activity") {
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
                            <Fragment key={msg._id}>
                                {showUnreadBanner && (
                                    <div className="flex items-center gap-3 my-2">
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
                                        <div className="text-xs font-medium text-red-400 uppercase tracking-wider bg-red-900/50 px-3 py-1 rounded-full border border-red-800">
                                            New Messages
                                        </div>
                                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
                                    </div>
                                )}
                                <div
                                    id={`msg-${msg._id}`}
                                    className={`flex relative w-full gap-2.5 ${isOwnMessage ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {/* Avatar for others */}
                                    {!isOwnMessage && (
                                        <div className="flex-shrink-0 mt-0.5">
                                            {msg.sender?.avatar ? (
                                                <img src={msg.sender.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-700/50" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center text-[11px] font-bold border border-gray-700">
                                                    {msg.sender?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={`group relative w-fit max-w-[85%] md:max-w-[75%] transition-all duration-300 ${hasReactions ? "mb-4" : ""} ${activeHighlight === msg._id
                                            ? "ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/10 scale-[1.02]"
                                            : ""
                                            }`}
                                    >
                                        {/* Message bubble */}
                                        <div
                                            data-message-bubble
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
                                            <p className="text-sm whitespace-pre-wrap break-words">{renderMessageContent(msg.content)}</p>

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
                                                                    onClick={() => setLightboxImage(att.url)}
                                                                    className="max-w-[240px] sm:max-w-[320px] max-h-[240px] sm:max-h-[320px] object-contain rounded-lg border border-gray-700 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                                                />
                                                            );
                                                        }
                                                        if (att.type?.startsWith("video")) {
                                                            return (
                                                                <video key={i} controls className="max-w-[240px] sm:max-w-[320px] max-h-[240px] sm:max-h-[320px] rounded-lg border border-gray-700">
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

                                        {/* Reactions */}
                                        {hasReactions && (
                                            <div
                                                onMouseEnter={() => setHoveringReactionDetails(true)}
                                                onMouseLeave={() => setHoveringReactionDetails(false)}
                                                className="absolute -bottom-4 left-3 z-20 flex items-center rounded-full border border-gray-800/90 bg-gray-900 px-1.5 py-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
                                            >
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
                                                                className={`flex h-5 min-w-5 items-center justify-center gap-1 rounded-full px-0.5 text-[12px] transition-colors ${reacted
                                                                    ? "text-white"
                                                                    : "text-gray-100"
                                                                    }`}
                                                            >
                                                                <span className="leading-none">{reaction.emoji}</span>
                                                                {reaction.users?.length > 1 && (
                                                                    <span className="pl-0.5 pr-0.5 text-[10px] font-semibold leading-none text-gray-300">
                                                                        {reaction.users.length}
                                                                    </span>
                                                                )}
                                                            </button>

                                                            <div className="absolute left-1/2 top-full z-[100] mt-1.5 flex -translate-x-1/2 flex-col gap-1 rounded-md border border-gray-700/50 bg-gray-800/95 px-3 py-2 text-[11px] text-gray-200 opacity-0 shadow-xl backdrop-blur-sm transition-all duration-200 pointer-events-none group-hover/reaction:opacity-100 whitespace-nowrap">
                                                                {getReactionUsernames(reaction.users).map((uname: string, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between gap-3">
                                                                        <span className="font-medium text-gray-300">{uname}</span>
                                                                        <span>{reaction.emoji}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Seen indicator */}
                                        {showSeen && (
                                            <div className="flex items-center justify-end gap-1 mt-1 text-xs text-gray-500">
                                                <CheckCheck size={12} className="text-green-500" />
                                                <span>Seen by {seenUsers.size}</span>
                                            </div>
                                        )}

                                        {/* Hover Actions Toolbar */}
                                        <div
                                            className={`absolute -top-4 ${isOwnMessage ? "right-2" : "left-2"} transition-all duration-200 flex items-center z-10 ${hoveredMention || hoveringReactionDetails
                                                ? "opacity-0 pointer-events-none translate-y-2"
                                                : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                                                }`}
                                        >
                                            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                                                {/* Quick reactions */}
                                                <div className="flex items-center px-1">
                                                    {["👍", "❤️", "🔥", "😂"].map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(msg._id, emoji)}
                                                            className="w-7 h-7 rounded hover:bg-gray-700 flex items-center justify-center text-sm transition-colors"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="w-px h-4 bg-gray-700 mx-1" />

                                                {/* Convert to Task button */}
                                                <button
                                                    onClick={() => openTaskModal(msg)}
                                                    className="text-gray-300 hover:text-white hover:bg-gray-700 px-3 h-8 text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                                    title="Convert to Task"
                                                >
                                                    <Flag size={12} />
                                                    Task
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Avatar for current user */}
                                    {isOwnMessage && (
                                        <div className="flex-shrink-0 mt-0.5">
                                            {msg.sender?.avatar || (session?.user as any)?.image || (session?.user as any)?.avatar ? (
                                                <img src={msg.sender?.avatar || (session?.user as any)?.image || (session?.user as any)?.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shadow-sm border border-indigo-500/30" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center text-[11px] font-bold border border-indigo-500/30">
                                                    {username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                        className="absolute bottom-4 right-6 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-black/50 transition-all z-20 group"
                    >
                        <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                    </button>
                )}
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

                        {showMentions && (

                            <div
                                className="
      absolute
      bottom-14
      left-0
      w-72
      max-h-60
      overflow-y-auto
      bg-gray-900
      border
      border-gray-700
      rounded-xl
      shadow-2xl
      z-50
      p-1
    "
                            >

                                {filteredMentions.map(
                                    (member, index) => {

                                        const active =
                                            index === mentionIndex;

                                        return (

                                            <button
                                                key={member.user._id}
                                                type="button"
                                                onClick={() =>
                                                    selectMention(
                                                        member.user.username
                                                    )
                                                }
                                                className={`
              w-full
              flex
              items-center
              gap-3
              px-3
              py-2
              rounded-lg
              transition-all
              text-left
              ${active
                                                        ? "bg-indigo-600/20 border border-indigo-500/30"
                                                        : "hover:bg-gray-800"
                                                    }
            `}
                                            >

                                                {member.user.avatar ? (

                                                    <img
                                                        src={
                                                            member.user.avatar
                                                        }
                                                        alt="avatar"
                                                        className="
                  w-8
                  h-8
                  rounded-full
                  object-cover
                "
                                                    />

                                                ) : (

                                                    <div
                                                        className="
                  w-8
                  h-8
                  rounded-full
                  bg-gray-700
                  flex
                  items-center
                  justify-center
                  text-xs
                  text-white
                "
                                                    >
                                                        {member.user.username?.[0]?.toUpperCase()}
                                                    </div>

                                                )}

                                                <div className="flex flex-col">

                                                    <span className="text-sm text-white font-medium">
                                                        {member.user.username}
                                                    </span>

                                                    <span className="text-xs text-gray-400">
                                                        {member.role}
                                                    </span>

                                                </div>

                                            </button>

                                        );

                                    }
                                )}

                            </div>

                        )}

                        <textarea
                            value={content}
                            onChange={handleTyping}
                            onKeyDown={(e) => {

                                // ===================================
                                // 🔥 MENTION NAVIGATION
                                // ===================================

                                if (
                                    showMentions &&
                                    filteredMentions.length > 0
                                ) {

                                    if (e.key === "ArrowDown") {

                                        e.preventDefault();

                                        setMentionIndex((prev) =>
                                            prev ===
                                                filteredMentions.length - 1
                                                ? 0
                                                : prev + 1
                                        );

                                        return;

                                    }

                                    if (e.key === "ArrowUp") {

                                        e.preventDefault();

                                        setMentionIndex((prev) =>
                                            prev === 0
                                                ? filteredMentions.length - 1
                                                : prev - 1
                                        );

                                        return;

                                    }

                                    if (e.key === "Enter") {

                                        e.preventDefault();

                                        selectMention(
                                            filteredMentions[
                                                mentionIndex
                                            ].user.username
                                        );

                                        return;

                                    }

                                    if (e.key === "Escape") {

                                        setShowMentions(false);

                                        return;

                                    }

                                }

                                // ===================================
                                // 🔥 NORMAL SEND
                                // ===================================

                                if (
                                    e.key === "Enter" &&
                                    !e.shiftKey
                                ) {

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

            <AnimatePresence>
                {renderHoveredMentionProfile()}
            </AnimatePresence>

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

            {/* Custom Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${toast.type === "success" ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} backdrop-blur-md`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${toast.type === "success" ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {toast.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>
                        <span className="text-sm font-medium text-gray-200">{toast.message}</span>
                        <button onClick={() => setToast(p => ({ ...p, show: false }))} className="ml-2 text-gray-500 hover:text-gray-300 transition-colors">
                            <XCircle size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Lightbox */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={lightboxImage}
                            alt="Fullscreen attachment"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
