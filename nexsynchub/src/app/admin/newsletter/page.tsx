"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Download,
  Filter,
  Mail,
  Radio,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "framer-motion";

const T = {
  bg: "#060810",
  bgDeep: "#03040A",
  surface: "rgba(8,12,26,0.80)",
  surfaceHi: "rgba(14,20,44,0.90)",
  border: "rgba(56,189,248,0.07)",
  borderMid: "rgba(56,189,248,0.13)",
  borderHi: "rgba(56,189,248,0.22)",
  borderGlow: "rgba(56,189,248,0.40)",
  cyan: "#38BDF8",
  cyanBright: "#7DD3FC",
  cyanLo: "rgba(56,189,248,0.08)",
  cyanMid: "rgba(56,189,248,0.16)",
  emerald: "#10B981",
  emeraldLo: "rgba(16,185,129,0.10)",
  emeraldMid: "rgba(16,185,129,0.20)",
  gold: "#F59E0B",
  goldLo: "rgba(245,158,11,0.10)",
  goldMid: "rgba(245,158,11,0.20)",
  rose: "#FB7185",
  roseLo: "rgba(251,113,133,0.10)",
  roseMid: "rgba(251,113,133,0.20)",
  violet: "#7C3AED",
  violetLo: "rgba(124,58,237,0.10)",
  violetMid: "rgba(124,58,237,0.20)",
  text: "#E8F4FF",
  textDim: "#8BA3C0",
  textMuted: "#3D506A",
  textGhost: "#1E2D42",
};

type SubscriberStatus =
  | "verified"
  | "pending"
  | "unsubscribed";

interface NewsletterSubscriberRow {
  _id: string;
  email: string;
  isVerified: boolean;
  isSubscribed: boolean;
  source: string;
  tags: string[];
  preferences?: {
    frequency?: string;
    workspaceDigests?: boolean;
    aiInsights?: boolean;
    operationalSummaries?: boolean;
    productUpdates?: boolean;
  };
  lastEmailSentAt?: string | null;
  verifiedAt?: string | null;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubscribersResponse {
  subscribers: NewsletterSubscriberRow[];
  stats: {
    total: number;
    verified: number;
    pending: number;
    unsubscribed: number;
  };
  sources: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const statusOptions = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "Verified",
    value: "verified",
  },
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Unsubscribed",
    value: "unsubscribed",
  },
];

function AnimCounter({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let current = 0;
    const end = value;
    const step = Math.max(
      1,
      Math.ceil(end / 32)
    );
    const timer = window.setInterval(() => {
      current = Math.min(current + step, end);
      setDisplay(current);
      if (current >= end) {
        window.clearInterval(timer);
      }
    }, 18);

    return () => {
      window.clearInterval(timer);
    };
  }, [value]);

  return (
    <span
      style={{
        color,
        fontFamily:
          "'JetBrains Mono',monospace",
      }}
    >
      {display.toLocaleString()}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
  sublabel,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ElementType;
  sublabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-2xl px-4 py-3.5 flex items-center gap-3"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        backdropFilter:
          "blur(20px) saturate(160%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 0% 50%, ${color}12, transparent)`,
        }}
      />
      <div
        className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `${color}14`,
          border: `1px solid ${color}30`,
        }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div className="relative min-w-0">
        <div className="text-xl font-black leading-none">
          <AnimCounter value={value} color={color} />
        </div>
        <div
          className="text-[10px] font-bold uppercase tracking-widest mt-1"
          style={{ color: T.textMuted }}
        >
          {label}
        </div>
      </div>
      {sublabel && (
        <div
          className="relative ml-auto text-[9px] font-medium px-2 py-0.5 rounded-md"
          style={{
            background: `${color}10`,
            color,
            border: `1px solid ${color}20`,
          }}
        >
          {sublabel}
        </div>
      )}
    </motion.div>
  );
}

function getSubscriberStatus(
  subscriber: NewsletterSubscriberRow
): SubscriberStatus {
  if (!subscriber.isSubscribed) {
    return "unsubscribed";
  }

  return subscriber.isVerified
    ? "verified"
    : "pending";
}

function StatusBadge({
  status,
}: {
  status: SubscriberStatus;
}) {
  const config = {
    verified: {
      label: "Verified",
      icon: BadgeCheck,
      color: T.emerald,
      bg: T.emeraldLo,
      border: T.emeraldMid,
    },
    pending: {
      label: "Pending",
      icon: Clock3,
      color: T.gold,
      bg: T.goldLo,
      border: T.goldMid,
    },
    unsubscribed: {
      label: "Unsubscribed",
      icon: XCircle,
      color: T.rose,
      bg: T.roseLo,
      border: T.roseMid,
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontFamily:
          "'JetBrains Mono',monospace",
      }}
    >
      <Icon size={11} />
      {config.label}
    </span>
  );
}

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: idx * 0.04 }}
      style={{ borderBottom: `1px solid ${T.border}` }}
    >
      {["w-64", "w-24", "w-28", "w-36", "w-44", "w-28"].map((width, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className={`h-4 ${width} rounded-md`}
            style={{
              background:
                "rgba(56,189,248,0.04)",
              animation: `pulse 2s ease-in-out ${idx * 0.1}s infinite`,
            }}
          />
        </td>
      ))}
    </motion.tr>
  );
}

function FilterTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto"
      style={{
        background: T.surface,
        border: `1px solid ${T.borderMid}`,
      }}
    >
      {statusOptions.map((option) => {
        const selected = active === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className="relative px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
            style={{
              color: selected
                ? T.cyanBright
                : T.textMuted,
              fontFamily:
                "'JetBrains Mono',monospace",
            }}
          >
            {selected && (
              <motion.span
                layoutId="newsletter-status-filter"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: T.cyanMid,
                  border: `1px solid ${T.borderGlow}`,
                  boxShadow:
                    "0 0 16px rgba(56,189,248,0.14)",
                }}
              />
            )}
            <span className="relative z-10">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SubscriberTicker({
  subscribers,
}: {
  subscribers: NewsletterSubscriberRow[];
}) {
  if (!subscribers.length) {
    return null;
  }

  const tickerItems = [
    ...subscribers.slice(0, 8),
    ...subscribers.slice(0, 8),
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl py-2.5"
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
      }}
    >
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 24,
          repeat: Infinity,
          ease: "linear",
        }}
        className="flex items-center gap-8 whitespace-nowrap"
      >
        {tickerItems.map((subscriber, index) => {
          const rowStatus =
            getSubscriberStatus(subscriber);
          const color =
            rowStatus === "verified"
              ? T.emerald
              : rowStatus === "pending"
                ? T.gold
                : T.rose;

          return (
            <span
              key={`${subscriber._id}-${index}`}
              className="text-[10px] flex items-center gap-2"
              style={{
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              <span style={{ color }}>◆</span>
              <span style={{ color: T.textDim }}>
                {subscriber.email}
              </span>
              <span style={{ color: T.textMuted }}>
                {rowStatus}
              </span>
              <span style={{ color: T.textGhost }}>
                |
              </span>
            </span>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] =
    useState<NewsletterSubscriberRow[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    unsubscribed: 0,
  });
  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState("all");
  const [source, setSource] =
    useState("all");
  const [sources, setSources] =
    useState<string[]>([]);
  const [loading, setLoading] =
    useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
      status,
      source,
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return params.toString();
  }, [
    pagination.page,
    pagination.limit,
    search,
    status,
    source,
  ]);

  useEffect(() => {
    const controller =
      new AbortController();

    const fetchSubscribers = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/admin/newsletter/subscribers?${query}`,
          {
            signal: controller.signal,
          }
        );
        const data =
          (await response.json()) as SubscribersResponse;

        if (response.ok) {
          setSubscribers(data.subscribers);
          setStats(data.stats);
          setSources(data.sources || []);
          setPagination(data.pagination);
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "FETCH NEWSLETTER SUBSCRIBERS ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchSubscribers();

    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      page: 1,
    }));
  }, [search, status, source]);

  const exportToCSV = () => {
    const escapeCSV = (value?: string | null) =>
      `"${(value || "").replace(/"/g, '""')}"`;

    const headers = [
      "Email",
      "Status",
      "Source",
      "Tags",
      "Frequency",
      "Subscribed At",
      "Verified At",
      "Unsubscribed At",
      "Last Email Sent At",
    ];

    const rows = subscribers.map((subscriber) =>
      [
        escapeCSV(subscriber.email),
        getSubscriberStatus(subscriber),
        escapeCSV(subscriber.source),
        escapeCSV(subscriber.tags.join("; ")),
        escapeCSV(
          subscriber.preferences?.frequency ||
            "weekly"
        ),
        escapeCSV(
          new Date(
            subscriber.createdAt
          ).toISOString()
        ),
        escapeCSV(subscriber.verifiedAt),
        escapeCSV(subscriber.unsubscribedAt),
        escapeCSV(subscriber.lastEmailSentAt),
      ].join(",")
    );

    const blob = new Blob(
      [[headers.join(","), ...rows].join("\n")],
      {
        type: "text/csv;charset=utf-8;",
      }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `newsletter_subscribers_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === pagination.page
    ) {
      return;
    }

    setPagination((current) => ({
      ...current,
      page,
    }));
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: T.bg,
        color: T.text,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Familjen+Grotesk:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        * { font-family:'DM Sans',sans-serif; }
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.2); border-radius:99px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.38; } }
        @keyframes h-scan {
          0% { top: 0%; opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
        .newsletter-scanline { animation: h-scan 6s linear infinite; }
      `}</style>

      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div style={{ position: "absolute", top: -200, left: -150, width: 700, height: 600, borderRadius: "50%", background: "rgba(56,189,248,0.05)", filter: "blur(120px)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "rgba(124,58,237,0.04)", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${T.textGhost}22 1px, transparent 1px), linear-gradient(90deg, ${T.textGhost}22 1px, transparent 1px)`, backgroundSize: "32px 32px", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(56,189,248,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px", backgroundPosition: "16px 16px" }} />
        <div className="newsletter-scanline absolute left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)" }} />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-2 mb-4"
          >
            <span
              className="text-[9px] font-black uppercase tracking-[0.3em]"
              style={{
                color: T.cyan,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              ● ADMIN CONSOLE
            </span>
            <span
              className="text-[9px]"
              style={{
                color: T.textMuted,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              / intelligence-subscribers
            </span>
            <div
              className="flex-1 h-px ml-2"
              style={{
                background: `linear-gradient(90deg, ${T.borderMid}, transparent)`,
              }}
            />
            <span
              className="text-[9px]"
              style={{
                color: T.textMuted,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              {new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")}{" "}
              UTC
            </span>
          </motion.div>

          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: T.cyanLo,
                    filter: "blur(16px)",
                  }}
                />
                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(56,189,248,0.05) 100%)",
                    border: `1px solid ${T.borderHi}`,
                    boxShadow:
                      "0 8px 32px rgba(56,189,248,0.12), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <Mail size={24} style={{ color: T.cyan }} />
                </div>
              </div>
              <div>
                <h1
                  className="text-3xl sm:text-4xl font-black text-white leading-none"
                  style={{
                    fontFamily:
                      "'Familjen Grotesk',sans-serif",
                    letterSpacing: "-0.04em",
                  }}
                >
                  Newsletter Subscribers
                </h1>
                <p
                  className="text-sm mt-1.5 font-medium flex items-center gap-2"
                  style={{ color: T.textMuted }}
                >
                  <Radio size={11} style={{ color: T.cyan }} />
                  Double opt-in control layer for future intelligence digests
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
            >
              <StatCard label="Total" value={stats.total} color={T.cyan} icon={Database} />
              <StatCard label="Verified" value={stats.verified} color={T.emerald} icon={BadgeCheck} sublabel={stats.verified > 0 ? "OPT-IN" : undefined} />
              <StatCard label="Pending" value={stats.pending} color={T.gold} icon={Clock3} />
              <StatCard label="Left" value={stats.unsubscribed} color={T.rose} icon={XCircle} />
            </motion.div>
          </div>
        </motion.div>

        {!loading && subscribers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-5"
          >
            <SubscriberTicker subscribers={subscribers} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.15,
            duration: 0.45,
          }}
          className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center mb-5"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: T.textMuted }}
            />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search subscriber email..."
              className="w-full lg:w-[420px] pl-10 pr-10 py-3 rounded-2xl text-sm outline-none transition-all duration-300"
              style={{
                background: T.surface,
                border: `1px solid ${
                  search ? T.borderGlow : T.borderMid
                }`,
                color: T.text,
                backdropFilter: "blur(20px)",
                boxShadow: search
                  ? "0 0 0 3px rgba(56,189,248,0.08)"
                  : "none",
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg"
                style={{
                  background:
                    "rgba(255,255,255,0.06)",
                  color: T.textMuted,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <FilterTabs
            active={status}
            onChange={setStatus}
          />

          <div className="flex items-center gap-2 lg:ml-auto">
            <Filter
              size={14}
              style={{ color: T.textMuted }}
            />
            <select
              value={source}
              onChange={(event) =>
                setSource(event.target.value)
              }
              className="rounded-xl px-3 py-2.5 text-[10px] outline-none uppercase tracking-widest"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderMid}`,
                color: T.textDim,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              <option value="all" style={{ background: T.bgDeep }}>
                All sources
              </option>
              {sources.map((item) => (
                <option
                  key={item}
                  value={item}
                  style={{ background: T.bgDeep }}
                >
                  {item.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button
              onClick={exportToCSV}
              disabled={
                loading || subscribers.length === 0
              }
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderMid}`,
                color: T.textDim,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              <Download size={13} />
              CSV
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 px-0.5"
        >
            <p
              className="text-[10px] w-full sm:w-auto text-left"
              style={{
                color: T.textMuted,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              <span style={{ color: T.cyan }}>
                {subscribers.length}
              </span>{" "}
              results
              {search && (
                <span>
                  {" "}
                  for &quot;
                  <span style={{ color: T.text }}>
                    {search}
                  </span>
                  &quot;
                </span>
              )}
              {status !== "all" && (
                <span>
                  {" "}
                  in{" "}
                  <span style={{ color: T.violet }}>
                    {status}
                  </span>
                </span>
              )}
              <span>
                {" "}
                / {pagination.total} total
              </span>
            </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={
                pagination.page <= 1 || loading
              }
              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-25 hover:bg-white/5"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderMid}`,
                color: T.textMuted,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              {"<<"}
            </button>
            <button
              onClick={() =>
                goToPage(pagination.page - 1)
              }
              disabled={
                pagination.page <= 1 || loading
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              style={{
                border: `1px solid ${T.borderMid}`,
                background: T.surface,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div className="hidden sm:flex items-center gap-1">
              {Array.from(
                {
                  length: Math.min(
                    Math.max(pagination.totalPages, 1),
                    7
                  ),
                },
                (_, index) => {
                  const total = Math.max(
                    pagination.totalPages,
                    1
                  );
                  const page =
                    total <= 7
                      ? index + 1
                      : pagination.page <= 4
                        ? index + 1
                        : pagination.page >= total - 3
                          ? total - 6 + index
                          : pagination.page - 3 + index;
                  const isActive =
                    page === pagination.page;

                  return (
                    <motion.button
                      key={page}
                      onClick={() => goToPage(page)}
                      whileTap={{ scale: 0.9 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all"
                      style={{
                        background: isActive
                          ? T.cyanMid
                          : "transparent",
                        border: isActive
                          ? `1px solid ${T.borderGlow}`
                          : "1px solid transparent",
                        color: isActive
                          ? T.cyan
                          : T.textMuted,
                        fontFamily:
                          "'JetBrains Mono',monospace",
                      }}
                    >
                      {page}
                    </motion.button>
                  );
                }
              )}
            </div>
            <span
              className="sm:hidden text-[10px] font-black px-2"
              style={{
                color: T.textMuted,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              {pagination.page} /{" "}
              {Math.max(pagination.totalPages, 1)}
            </span>
            <button
              onClick={() =>
                goToPage(pagination.page + 1)
              }
              disabled={
                pagination.page >=
                  pagination.totalPages || loading
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
              style={{
                border: `1px solid ${T.borderMid}`,
                background: T.surface,
              }}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() =>
                goToPage(
                  Math.max(pagination.totalPages, 1)
                )
              }
              disabled={
                pagination.page >=
                  pagination.totalPages || loading
              }
              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-25 hover:bg-white/5"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderMid}`,
                color: T.textMuted,
                fontFamily:
                  "'JetBrains Mono',monospace",
              }}
            >
              {">>"}
            </button>
          </div>
        </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: T.surface,
            border: `1px solid ${T.borderMid}`,
            backdropFilter:
              "blur(24px) saturate(160%)",
            boxShadow:
              "0 24px 60px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${T.cyan}70, ${T.violet}50, transparent)`,
            }}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                  }}
                >
                  {[
                    "",
                    "Subscriber",
                    "Status",
                    "Source",
                    "Preferences",
                    "Lifecycle",
                    "Joined",
                  ].map((label) => (
                    <th
                      key={label}
                      className={`${label ? "px-4" : "w-0.5 p-0"} py-3.5 text-left`}
                      style={{
                        background:
                          "rgba(4,8,20,0.50)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {label && (
                        <span
                          className="text-[9px] font-black uppercase tracking-[0.2em]"
                          style={{
                            color: T.textMuted,
                            fontFamily:
                              "'JetBrains Mono',monospace",
                          }}
                        >
                          {label}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {loading ? (
                  Array.from({ length: 6 }).map(
                    (_, idx) => (
                      <SkeletonRow
                        key={idx}
                        idx={idx}
                      />
                    )
                  )
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center gap-4 py-24 text-center">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{
                            background: T.cyanLo,
                            border: `1px solid ${T.cyanMid}`,
                          }}
                        >
                          <Mail
                            size={22}
                            style={{ color: T.cyan }}
                          />
                        </div>
                        <div>
                          <p
                            className="text-sm font-bold text-white mb-1"
                            style={{
                              fontFamily:
                                "'Familjen Grotesk',sans-serif",
                            }}
                          >
                            No subscribers found
                          </p>
                          <p
                            className="text-[11px]"
                            style={{ color: T.textMuted }}
                          >
                            Try adjusting search, status, or source.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  subscribers.map((subscriber, idx) => {
                    const rowStatus =
                      getSubscriberStatus(subscriber);
                    const isLast =
                      idx === subscribers.length - 1;

                    return (
                      <motion.tr
                        key={subscriber._id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          x: 12,
                          transition: { duration: 0.15 },
                        }}
                        transition={{
                          duration: 0.35,
                          ease: [0.22, 1, 0.36, 1],
                          delay: idx < 12 ? idx * 0.025 : 0,
                        }}
                        className="group transition-all duration-150"
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : `1px solid ${T.border}`,
                        }}
                        onMouseEnter={(event) =>
                          (event.currentTarget.style.background =
                            "rgba(56,189,248,0.03)")
                        }
                        onMouseLeave={(event) =>
                          (event.currentTarget.style.background =
                            "transparent")
                        }
                      >
                        <td className="w-0.5 p-0 relative">
                          <div
                            className="absolute inset-y-0 left-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{
                              background:
                                rowStatus === "verified"
                                  ? T.emerald
                                  : rowStatus === "pending"
                                    ? T.gold
                                    : T.rose,
                            }}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: T.cyanLo,
                                border: `1px solid ${T.cyanMid}`,
                                color: T.cyan,
                              }}
                            >
                              <Send size={15} />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-[12px] font-semibold truncate leading-tight"
                                style={{ color: T.text }}
                              >
                                {subscriber.email}
                              </p>
                              <p
                                className="text-[10px] truncate mt-0.5"
                                style={{
                                  color: T.textMuted,
                                  fontFamily:
                                    "'JetBrains Mono',monospace",
                                }}
                              >
                                {subscriber.tags.length
                                  ? subscriber.tags.join(", ")
                                  : "No tags"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge
                            status={rowStatus}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className="inline-flex rounded-lg px-2 py-1 text-[10px] capitalize"
                            style={{
                              background: T.cyanLo,
                              border: `1px solid ${T.cyanMid}`,
                              color: T.cyan,
                              fontFamily:
                                "'JetBrains Mono',monospace",
                            }}
                          >
                            {subscriber.source.replace(
                              /_/g,
                              " "
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span
                              className="text-[11px] font-semibold capitalize"
                              style={{
                                color: T.text,
                                fontFamily:
                                  "'JetBrains Mono',monospace",
                              }}
                            >
                              {(
                                subscriber.preferences
                                  ?.frequency ||
                                "weekly"
                              ).replace(/_/g, " ")}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: T.textMuted }}
                            >
                              Digest{" "}
                              {subscriber.preferences
                                ?.workspaceDigests ===
                              false
                                ? "off"
                                : "on"}{" "}
                              / AI{" "}
                              {subscriber.preferences
                                ?.aiInsights === false
                                ? "off"
                                : "on"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="text-[11px] font-semibold"
                              style={{
                                color: T.text,
                                fontFamily:
                                  "'JetBrains Mono',monospace",
                              }}
                            >
                              {subscriber.verifiedAt
                                ? `Verified ${new Date(
                                    subscriber.verifiedAt
                                  ).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}`
                                : subscriber.unsubscribedAt
                                  ? `Left ${new Date(
                                      subscriber.unsubscribedAt
                                    ).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      }
                                    )}`
                                  : "Awaiting confirmation"}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{ color: T.textMuted }}
                            >
                              Last email:{" "}
                              {subscriber.lastEmailSentAt
                                ? new Date(
                                    subscriber.lastEmailSentAt
                                  ).toLocaleDateString()
                                : "none"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className="text-[11px] font-semibold"
                              style={{
                                color: T.text,
                                fontFamily:
                                  "'JetBrains Mono',monospace",
                              }}
                            >
                              {new Date(
                                subscriber.createdAt
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            <span
                              className="text-[10px]"
                              style={{
                                color: T.textMuted,
                                fontFamily:
                                  "'JetBrains Mono',monospace",
                              }}
                            >
                              {new Date(
                                subscriber.createdAt
                              ).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {!loading && subscribers.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between px-5 py-3"
              style={{
                borderTop: `1px solid ${T.border}`,
                background: "rgba(4,8,20,0.40)",
              }}
            >
              <p
                className="text-[10px]"
                style={{
                  color: T.textMuted,
                  fontFamily:
                    "'JetBrains Mono',monospace",
                }}
              >
                {subscribers.length} subscription records
              </p>
              <div className="flex items-center gap-1.5">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: T.emerald }}
                />
                <span
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{
                    color: T.emerald,
                    fontFamily:
                      "'JetBrains Mono',monospace",
                  }}
                >
                  Consent Registry Online
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
