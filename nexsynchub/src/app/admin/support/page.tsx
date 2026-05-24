// src/app/admin/support/page.tsx

"use client";

import {

    useEffect,
    useMemo,
    useState,

} from "react";

import {

    motion,

} from "framer-motion";

import { socket }
    from "@/lib/socket";

import {

    LifeBuoy,
    Search,
    Loader2,
    MessageSquareWarning,
    Clock3,
    CheckCircle2,
    AlertTriangle,
    Inbox,

} from "lucide-react";

type Ticket = {

    _id: string;

    category: string;

    subject: string;

    message: string;

    status: string;

    priority: string;

    attachments: any[];

    createdAt: string;

    user?: {

        username?: string;

        email?: string;

        avatar?: string;

        role?: string;

    };

    adminNotes?: string;

    handledBy?: {

        username?: string;

        email?: string;

    };

    resolutionMessage?: string;

};

export default function AdminSupportPage() {

    const [tickets,
        setTickets] =
        useState<Ticket[]>([]);

    const [loading,
        setLoading] =
        useState(true);

    const [query,
        setQuery] =
        useState("");

    const [statusFilter,
        setStatusFilter] =
        useState("all");

    const [

        selectedTicket,

        setSelectedTicket,

    ] = useState<Ticket | null>(
        null
    );

    const [

        adminNotes,

        setAdminNotes,

    ] = useState("");

    const [

        resolutionMessage,

        setResolutionMessage,

    ] = useState("");

    const [

        saving,

        setSaving,

    ] = useState(false);

    const TOKEN = {

        bg:
            "#050507",

        card:
            "rgba(255,255,255,0.04)",

        border:
            "rgba(255,255,255,0.08)",

        text:
            "#FFFFFF",

        muted:
            "rgba(255,255,255,0.62)",

        accent:
            "#A78BFA",

        accentMd:
            "rgba(124,58,237,0.3)",

        accentLo:
            "rgba(124,58,237,0.12)",

        green:
            "#34D399",

        yellow:
            "#FBBF24",

        red:
            "#FB7185",

    };

    useEffect(() => {

        fetchTickets();

        // 🔥 Join admin realtime room
        socket.emit(
            "join_admin_global"
        );

        // 🔥 New support ticket
        socket.on(

            "support_ticket_created",

            () => {

                fetchTickets();

            }

        );

        // 🔥 Ticket updated
        socket.on(

            "support_ticket_updated",

            () => {

                fetchTickets();

            }

        );

        return () => {

            socket.off(
                "support_ticket_created"
            );

            socket.off(
                "support_ticket_updated"
            );

        };

    }, []);

    const fetchTickets =
        async () => {

            try {

                setLoading(true);

                const res =
                    await fetch(
                        "/api/admin/support"
                    );

                const data =
                    await res.json();

                if (!res.ok)
                    return;

                setTickets(
                    data.tickets
                );

            } catch (error) {

                console.error(
                    error
                );

            } finally {

                setLoading(false);

            }

        };

    const filteredTickets =
        useMemo(() => {

            return tickets.filter(
                (ticket) => {

                    const q =
                        query.toLowerCase();

                    const matchesSearch =

                        ticket.subject
                            .toLowerCase()
                            .includes(q)

                        ||

                        ticket.message
                            .toLowerCase()
                            .includes(q)

                        ||

                        ticket.user?.email
                            ?.toLowerCase()
                            .includes(q)

                        ||

                        ticket.user?.username
                            ?.toLowerCase()
                            .includes(q);

                    const matchesStatus =

                        statusFilter ===
                            "all"

                            ? true

                            : ticket.status ===
                            statusFilter;

                    return (
                        matchesSearch
                        &&
                        matchesStatus
                    );

                }
            );

        }, [

            tickets,
            query,
            statusFilter,

        ]);

    const stats = {

        total:
            tickets.length,

        open:
            tickets.filter(
                (t) =>
                    t.status === "open"
            ).length,

        progress:
            tickets.filter(
                (t) =>
                    t.status ===
                    "in_progress"
            ).length,

        resolved:
            tickets.filter(
                (t) =>
                    t.status ===
                    "resolved"
            ).length,

    };

    const handleSave =
        async () => {

            if (!selectedTicket)
                return;

            try {

                setSaving(true);

                const res =
                    await fetch(

                        "/api/admin/support/update",

                        {

                            method:
                                "PATCH",

                            headers: {

                                "Content-Type":
                                    "application/json",

                            },

                            body:
                                JSON.stringify({

                                    ticketId:
                                        selectedTicket._id,

                                    status:
                                        selectedTicket.status,

                                    adminNotes,

                                    resolutionMessage,

                                }),

                        }

                    );

                const data =
                    await res.json();

                if (!res.ok) {

                    alert(
                        data.error ||
                        "Failed to update ticket"
                    );

                    return;

                }

                // 🔥 Update local UI
                setTickets(
                    (prev) =>

                        prev.map(
                            (ticket) =>

                                ticket._id ===
                                    selectedTicket._id

                                    ? data.ticket

                                    : ticket
                        )
                );

                // 🔥 Close modal
                setSelectedTicket(
                    null
                );

            } catch (error) {

                console.error(
                    error
                );

                alert(
                    "Something went wrong"
                );

            } finally {

                setSaving(false);

            }

        };

    const getStatusColor =
        (
            status: string
        ) => {

            switch (status) {

                case "open":
                    return TOKEN.red;

                case "in_progress":
                    return TOKEN.yellow;

                case "resolved":
                    return TOKEN.green;

                default:
                    return TOKEN.muted;

            }

        };

    return (

        <main
            className="min-h-screen p-6"
            style={{
                background:
                    TOKEN.bg,
            }}
        >

            {/* Header */}
            <div className="mb-10">

                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 border text-sm"
                    style={{

                        background:
                            TOKEN.accentLo,

                        borderColor:
                            TOKEN.accentMd,

                        color:
                            TOKEN.accent,

                    }}
                >

                    <LifeBuoy
                        size={14}
                    />

                    Admin Support Center

                </div>

                <h1
                    className="text-4xl font-black text-white mb-3"
                    style={{
                        fontFamily:
                            "'Sora',sans-serif",
                    }}
                >

                    Support Tickets

                </h1>

                <p
                    className="text-sm"
                    style={{
                        color:
                            TOKEN.muted,
                    }}
                >

                    Manage support requests,
                    bug reports,
                    feedback,
                    and user issues.

                </p>

            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-5 mb-8">

                {[

                    {

                        label:
                            "Total Tickets",

                        value:
                            stats.total,

                        icon:
                            Inbox,

                    },

                    {

                        label:
                            "Open",

                        value:
                            stats.open,

                        icon:
                            AlertTriangle,

                    },

                    {

                        label:
                            "In Progress",

                        value:
                            stats.progress,

                        icon:
                            Clock3,

                    },

                    {

                        label:
                            "Resolved",

                        value:
                            stats.resolved,

                        icon:
                            CheckCircle2,

                    },

                ].map((item) => {

                    const Icon =
                        item.icon;

                    return (

                        <div

                            key={item.label}

                            className="rounded-3xl border p-6"

                            style={{

                                background:
                                    TOKEN.card,

                                borderColor:
                                    TOKEN.border,

                            }}
                        >

                            <div className="flex items-center justify-between mb-5">

                                <div
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{

                                        background:
                                            TOKEN.accentLo,

                                        border:
                                            `1px solid ${TOKEN.accentMd}`,

                                    }}
                                >

                                    <Icon
                                        size={18}
                                        color={
                                            TOKEN.accent
                                        }
                                    />

                                </div>

                                <span
                                    className="text-3xl font-black text-white"
                                >

                                    {item.value}

                                </span>

                            </div>

                            <p
                                className="text-sm font-medium"
                                style={{
                                    color:
                                        TOKEN.muted,
                                }}
                            >

                                {item.label}

                            </p>

                        </div>

                    );

                })}

            </div>

            {/* Filters */}
            <div
                className="rounded-3xl border p-5 mb-8"

                style={{

                    background:
                        TOKEN.card,

                    borderColor:
                        TOKEN.border,

                }}
            >

                <div className="flex flex-col lg:flex-row gap-4">

                    {/* Search */}
                    <div className="relative flex-1">

                        <Search
                            size={16}

                            className="absolute left-4 top-1/2 -translate-y-1/2"

                            color={
                                TOKEN.muted
                            }
                        />

                        <input

                            value={query}

                            onChange={(e) =>
                                setQuery(
                                    e.target.value
                                )
                            }

                            placeholder="Search tickets..."

                            className="w-full pl-11 pr-4 py-3 rounded-2xl outline-none text-sm"

                            style={{

                                background:
                                    "rgba(255,255,255,0.03)",

                                border:
                                    `1px solid ${TOKEN.border}`,

                                color:
                                    TOKEN.text,

                            }}
                        />

                    </div>

                    {/* Status Filter */}
                    <select

                        value={
                            statusFilter
                        }

                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }

                        className="px-4 py-3 rounded-2xl text-sm outline-none"

                        style={{

                            background:
                                "rgba(255,255,255,0.03)",

                            border:
                                `1px solid ${TOKEN.border}`,

                            color:
                                TOKEN.text,

                        }}
                    >

                        <option value="all">
                            All Status
                        </option>

                        <option value="open">
                            Open
                        </option>

                        <option value="in_progress">
                            In Progress
                        </option>

                        <option value="resolved">
                            Resolved
                        </option>

                        <option value="closed">
                            Closed
                        </option>

                    </select>

                </div>

            </div>

            {/* Tickets */}
            {loading ? (

                <div className="flex items-center justify-center py-28">

                    <Loader2
                        size={34}
                        className="animate-spin"
                        color={TOKEN.accent}
                    />

                </div>

            ) : filteredTickets.length === 0 ? (

                <div
                    className="rounded-3xl border p-16 text-center"

                    style={{

                        background:
                            TOKEN.card,

                        borderColor:
                            TOKEN.border,

                    }}
                >

                    <MessageSquareWarning
                        size={42}
                        className="mx-auto mb-5"
                        color={TOKEN.muted}
                    />

                    <h3
                        className="text-xl font-bold mb-2 text-white"
                    >

                        No tickets found

                    </h3>

                    <p
                        className="text-sm"
                        style={{
                            color:
                                TOKEN.muted,
                        }}
                    >

                        Support requests will appear here.

                    </p>

                </div>

            ) : (

                <div className="space-y-5">

                    {filteredTickets.map(
                        (ticket, index) => (

                            <motion.div

                                key={ticket._id}

                                initial={{
                                    opacity: 0,
                                    y: 18,
                                }}

                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}

                                transition={{
                                    duration: 0.35,
                                    delay:
                                        index * 0.03,
                                }}

                                className="rounded-3xl border p-6"

                                style={{

                                    background:
                                        TOKEN.card,

                                    borderColor:
                                        TOKEN.border,

                                }}
                            >

                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                                    {/* Left */}
                                    <div className="flex-1">

                                        <div className="flex flex-wrap items-center gap-3 mb-4">

                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-semibold uppercase"

                                                style={{

                                                    background:
                                                        TOKEN.accentLo,

                                                    color:
                                                        TOKEN.accent,

                                                    border:
                                                        `1px solid ${TOKEN.accentMd}`,

                                                }}
                                            >

                                                {
                                                    ticket.category.replaceAll(
                                                        "_",
                                                        " "
                                                    )
                                                }

                                            </span>

                                            <span
                                                className="text-xs font-semibold"

                                                style={{
                                                    color:
                                                        getStatusColor(
                                                            ticket.status
                                                        ),
                                                }}
                                            >

                                                {
                                                    ticket.status.replaceAll(
                                                        "_",
                                                        " "
                                                    )
                                                }

                                            </span>

                                        </div>

                                        <h3
                                            className="text-xl font-bold text-white mb-3"
                                        >

                                            {ticket.subject}

                                        </h3>

                                        <p
                                            className="text-sm leading-7 line-clamp-2 mb-5"

                                            style={{
                                                color:
                                                    TOKEN.muted,
                                            }}
                                        >

                                            {ticket.message}

                                        </p>

                                        <div className="flex flex-wrap items-center gap-5 text-xs">

                                            <span
                                                style={{
                                                    color:
                                                        TOKEN.muted,
                                                }}
                                            >

                                                {
                                                    ticket.user
                                                        ?.email
                                                }

                                            </span>

                                            <span
                                                style={{
                                                    color:
                                                        TOKEN.muted,
                                                }}
                                            >

                                                {
                                                    ticket.attachments
                                                        ?.length || 0
                                                } attachments

                                            </span>

                                        </div>

                                    </div>

                                    {/* Right */}
                                    <div className="text-right shrink-0">

                                        <p
                                            className="text-xs mb-3"

                                            style={{
                                                color:
                                                    TOKEN.muted,
                                            }}
                                        >

                                            {new Date(
                                                ticket.createdAt
                                            ).toLocaleString()}

                                        </p>

                                        <button

                                            onClick={() => {

                                                setSelectedTicket(
                                                    ticket
                                                );

                                                setAdminNotes(
                                                    ticket.adminNotes || ""
                                                );

                                                setResolutionMessage(
                                                    ticket.resolutionMessage || ""
                                                );

                                            }}

                                            className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all"

                                            style={{

                                                background:
                                                    TOKEN.accentLo,

                                                color:
                                                    TOKEN.accent,

                                                border:
                                                    `1px solid ${TOKEN.accentMd}`,

                                            }}
                                        >

                                            View Details

                                        </button>

                                    </div>

                                </div>

                            </motion.div>

                        )
                    )}

                </div>

            )}

            {/* ───────────────── MODAL ───────────────── */}

            {selectedTicket && (

                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">

                    {/* Backdrop */}
                    <div

                        onClick={() =>
                            setSelectedTicket(
                                null
                            )
                        }

                        className="absolute inset-0"

                        style={{

                            background:
                                "rgba(0,0,0,0.72)",

                            backdropFilter:
                                "blur(10px)",

                        }}
                    />

                    {/* Modal */}
                    <motion.div

                        initial={{
                            opacity: 0,
                            y: 20,
                            scale: 0.96,
                        }}

                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}

                        exit={{
                            opacity: 0,
                        }}

                        className="relative w-full max-w-4xl rounded-[34px] border overflow-hidden max-h-[92vh] overflow-y-auto"

                        style={{

                            background:
                                "#0B0B10",

                            borderColor:
                                TOKEN.border,

                        }}
                    >

                        {/* Header */}
                        <div
                            className="p-7 border-b"

                            style={{
                                borderColor:
                                    TOKEN.border,
                            }}
                        >

                            <div className="flex items-start justify-between gap-5">

                                <div>

                                    <div className="flex items-center gap-3 mb-4">

                                        <span
                                            className="px-3 py-1 rounded-full text-xs font-semibold uppercase"

                                            style={{

                                                background:
                                                    TOKEN.accentLo,

                                                color:
                                                    TOKEN.accent,

                                                border:
                                                    `1px solid ${TOKEN.accentMd}`,

                                            }}
                                        >

                                            {
                                                selectedTicket.category.replaceAll(
                                                    "_",
                                                    " "
                                                )
                                            }

                                        </span>

                                        <span
                                            className="text-xs font-semibold uppercase"

                                            style={{

                                                color:
                                                    getStatusColor(
                                                        selectedTicket.status
                                                    ),

                                            }}
                                        >

                                            {
                                                selectedTicket.status.replaceAll(
                                                    "_",
                                                    " "
                                                )
                                            }

                                        </span>

                                    </div>

                                    <h2
                                        className="text-3xl font-black text-white mb-3"

                                        style={{
                                            fontFamily:
                                                "'Sora',sans-serif",
                                        }}
                                    >

                                        {
                                            selectedTicket.subject
                                        }

                                    </h2>

                                    <div className="flex flex-wrap items-center gap-4 text-sm">

                                        <span
                                            style={{
                                                color:
                                                    TOKEN.muted,
                                            }}
                                        >

                                            {
                                                selectedTicket.user
                                                    ?.email
                                            }

                                        </span>

                                        <span
                                            style={{
                                                color:
                                                    TOKEN.muted,
                                            }}
                                        >

                                            {
                                                new Date(
                                                    selectedTicket.createdAt
                                                ).toLocaleString()
                                            }

                                        </span>

                                    </div>

                                </div>

                                {/* Close */}
                                <button

                                    onClick={() =>
                                        setSelectedTicket(
                                            null
                                        )
                                    }

                                    className="px-4 py-2 rounded-2xl text-sm font-semibold"

                                    style={{

                                        background:
                                            "rgba(255,255,255,0.04)",

                                        border:
                                            `1px solid ${TOKEN.border}`,

                                        color:
                                            TOKEN.text,

                                    }}
                                >

                                    Close

                                </button>

                            </div>

                        </div>

                        {/* Content */}
                        <div className="p-7 space-y-8">

                            {/* Message */}
                            <div>

                                <h3
                                    className="text-lg font-bold mb-4 text-white"
                                >

                                    Ticket Message

                                </h3>

                                <div
                                    className="rounded-3xl p-6"

                                    style={{

                                        background:
                                            "rgba(255,255,255,0.03)",

                                        border:
                                            `1px solid ${TOKEN.border}`,

                                    }}
                                >

                                    <p
                                        className="text-sm leading-8 whitespace-pre-wrap"

                                        style={{
                                            color:
                                                TOKEN.muted,
                                        }}
                                    >

                                        {
                                            selectedTicket.message
                                        }

                                    </p>

                                </div>

                            </div>

                            {/* Attachments */}
                            <div>

                                <h3
                                    className="text-lg font-bold mb-4 text-white"
                                >

                                    Attachments

                                </h3>

                                {selectedTicket.attachments?.length === 0 ? (

                                    <div
                                        className="rounded-3xl p-6 text-sm"

                                        style={{

                                            background:
                                                "rgba(255,255,255,0.03)",

                                            border:
                                                `1px solid ${TOKEN.border}`,

                                            color:
                                                TOKEN.muted,

                                        }}
                                    >

                                        No attachments uploaded.

                                    </div>

                                ) : (

                                    <div className="grid md:grid-cols-2 gap-4">

                                        {selectedTicket.attachments.map(
                                            (
                                                file: any,
                                                index: number
                                            ) => (

                                                <a

                                                    key={index}

                                                    href={file.url}

                                                    target="_blank"

                                                    className="rounded-3xl p-5 transition-all hover:translate-y-[-2px]"

                                                    style={{

                                                        background:
                                                            "rgba(255,255,255,0.03)",

                                                        border:
                                                            `1px solid ${TOKEN.border}`,

                                                    }}
                                                >

                                                    <p
                                                        className="font-semibold text-white mb-2"
                                                    >

                                                        {
                                                            file.filename
                                                        }

                                                    </p>

                                                    <p
                                                        className="text-xs"

                                                        style={{
                                                            color:
                                                                TOKEN.muted,
                                                        }}
                                                    >

                                                        {
                                                            (
                                                                file.size /
                                                                1024 /
                                                                1024
                                                            ).toFixed(2)
                                                        } MB

                                                    </p>

                                                </a>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>

                            {/* Admin Notes */}
                            <div>

                                <h3
                                    className="text-lg font-bold mb-4 text-white"
                                >

                                    Admin Notes

                                </h3>

                                <textarea

                                    rows={6}

                                    value={adminNotes}

                                    onChange={(e) =>
                                        setAdminNotes(
                                            e.target.value
                                        )
                                    }

                                    placeholder="Internal admin notes..."

                                    className="w-full rounded-3xl p-5 outline-none resize-none text-sm"

                                    style={{

                                        background:
                                            "rgba(255,255,255,0.03)",

                                        border:
                                            `1px solid ${TOKEN.border}`,

                                        color:
                                            TOKEN.text,

                                    }}
                                />

                            </div>

                            {/* Resolution Message */}
                            <div>

                                <h3
                                    className="text-lg font-bold mb-4 text-white"
                                >

                                    Resolution Message

                                </h3>

                                <textarea

                                    rows={5}

                                    value={resolutionMessage}

                                    onChange={(e) =>
                                        setResolutionMessage(
                                            e.target.value
                                        )
                                    }

                                    placeholder="Message sent to user when resolving or closing..."

                                    className="w-full rounded-3xl p-5 outline-none resize-none text-sm"

                                    style={{

                                        background:
                                            "rgba(255,255,255,0.03)",

                                        border:
                                            `1px solid ${TOKEN.border}`,

                                        color:
                                            TOKEN.text,

                                    }}
                                />

                            </div>

                            {/* Status */}
                            <div>

                                <h3
                                    className="text-lg font-bold mb-4 text-white"
                                >

                                    Ticket Status

                                </h3>

                                <select

                                    value={
                                        selectedTicket.status
                                    }

                                    onChange={(e) =>

                                        setSelectedTicket({

                                            ...selectedTicket,

                                            status:
                                                e.target.value,

                                        })

                                    }

                                    className="px-5 py-3 rounded-2xl outline-none text-sm"

                                    style={{

                                        background:
                                            "rgba(255,255,255,0.03)",

                                        border:
                                            `1px solid ${TOKEN.border}`,

                                        color:
                                            TOKEN.text,

                                    }}
                                >

                                    <option value="open">
                                        Open
                                    </option>

                                    <option value="in_progress">
                                        In Progress
                                    </option>

                                    <option value="resolved">
                                        Resolved
                                    </option>

                                    <option value="closed">
                                        Closed
                                    </option>

                                </select>

                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-4">

                                <button

                                    onClick={() =>
                                        setSelectedTicket(
                                            null
                                        )
                                    }

                                    className="px-6 py-3 rounded-2xl font-semibold"

                                    style={{

                                        background:
                                            "rgba(255,255,255,0.04)",

                                        border:
                                            `1px solid ${TOKEN.border}`,

                                        color:
                                            TOKEN.text,

                                    }}
                                >

                                    Cancel

                                </button>

                                <button

                                    onClick={handleSave}

                                    disabled={saving}

                                    className="px-6 py-3 rounded-2xl font-semibold text-white disabled:opacity-60"

                                    style={{

                                        background:
                                            "linear-gradient(135deg,#7C3AED,#4F46E5)",

                                        boxShadow:
                                            "0 10px 30px rgba(124,58,237,0.25)",

                                    }}
                                >

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}

                                </button>

                            </div>

                        </div>

                    </motion.div>

                </div>

            )}

        </main>
    );
}