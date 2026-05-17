import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { redirect } from "next/navigation";
import ProfileBasicInfo from "@/components/profile/ProfileBasicInfo";
import { User as UserIcon, Shield, Crown, BadgeCheck, Activity, Key, CalendarDays } from "lucide-react";

/* ─── design tokens (matches AdminPage) ─────────────────────────────────── */
const T = {
    bg:       "#03060F",
    surface:  "rgba(8,16,40,0.70)",
    border:   "rgba(99,140,255,0.10)",
    borderHi: "rgba(99,140,255,0.22)",
    accent:   "#3D7BFF",
    accentLo: "rgba(61,123,255,0.12)",
    accentMd: "rgba(61,123,255,0.25)",
    emerald:  "#10B981",
    gold:     "#F59E0B",
    violet:   "#7C3AED",
    text:     "#E2E8F8",
    muted:    "#4A5578",
};

export default async function AdminProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect("/login");
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
        redirect("/login");
    }

    const profile = {
        username: user.username,
        email: user.email,
        displayName: user.displayName || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
    };

    const isSuperAdmin = user.role === "super_admin";
    const RoleIcon = isSuperAdmin ? Crown : Shield;
    const roleColor = isSuperAdmin ? T.gold : T.accent;
    const roleBg = isSuperAdmin ? "rgba(245,158,11,0.12)" : T.accentLo;
    const roleBorder = isSuperAdmin ? "rgba(245,158,11,0.25)" : T.accentMd;

    const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
                * { font-family:'DM Sans',sans-serif; }
            `}</style>

            {/* ambient background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
                <div style={{ position:"absolute", top:-160, left:-120, width:600, height:600, borderRadius:"50%", background:"rgba(61,123,255,0.07)", filter:"blur(120px)" }} />
                <div style={{ position:"absolute", top:300, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(124,58,237,0.05)", filter:"blur(100px)" }} />
                <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(99,140,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,140,255,0.03) 1px,transparent 1px)", backgroundSize:"48px 48px" }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
                
                {/* ── HEADER ── */}
                <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background:"linear-gradient(135deg,#3D7BFF,#7C3AED)", boxShadow:"0 4px 20px rgba(61,123,255,0.30)" }}>
                            <UserIcon size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily:"'Sora',sans-serif" }}>Admin Profile</h1>
                            <p className="text-sm mt-1" style={{ color:T.muted }}>Manage your administrative account identity</p>
                        </div>
                    </div>

                    {/* Admin Badge & Verified Pill */}
                    <div className="flex items-center gap-3">
                        {user.isEmailVerified && (
                            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-semibold" style={{ background: "rgba(16,185,129,0.10)", color: T.emerald, border: "1px solid rgba(16,185,129,0.22)", backdropFilter:"blur(20px)" }}>
                                <BadgeCheck size={16} />
                                Verified
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-semibold shadow-lg" style={{ background: roleBg, color: roleColor, border: `1px solid ${roleBorder}`, backdropFilter:"blur(20px)" }}>
                            <RoleIcon size={16} />
                            {isSuperAdmin ? "Super Admin" : "Admin"}
                        </div>
                    </div>
                </div>

                {/* ── STATS ROW ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: "Account Status", value: "Active", icon: Activity, color: T.emerald },
                        { label: "Role Privileges", value: isSuperAdmin ? "Full Access" : "Restricted", icon: Key, color: roleColor },
                        { label: "Member Since", value: joinedDate, icon: CalendarDays, color: T.accent },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="p-4 rounded-2xl flex items-center gap-4 transition-transform hover:-translate-y-1 duration-300 shadow-sm hover:shadow-md" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                                    <Icon size={18} style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: T.muted }}>{stat.label}</p>
                                    <p className="text-sm font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── PROFILE INFO WRAPPER ── */}
                <div className="relative rounded-3xl shadow-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                    {/* top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 z-20" style={{ background:`linear-gradient(90deg,${T.accent},${T.violet})` }} />
                    
                    <div className="[&>div]:!bg-transparent [&>div]:!border-none [&>div]:!shadow-none [&>div]:!backdrop-blur-none [&>div]:!p-5 sm:[&>div]:!p-8">
                        <ProfileBasicInfo initialProfile={profile} />
                    </div>
                </div>

            </div>
        </div>
    );
}