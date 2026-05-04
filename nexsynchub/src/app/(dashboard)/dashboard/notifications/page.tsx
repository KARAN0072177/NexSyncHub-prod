import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Bell, CheckCheck, Clock, Inbox } from "lucide-react";

export default async function NotificationsPage() {
  await connectDB();

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Unauthorized</h2>
          <p className="text-gray-400 mt-2">Please sign in to view notifications.</p>
        </div>
      </div>
    );
  }

  const notifications = await Notification.find({
    user: session.user.id,
  }).sort({ createdAt: -1 });

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Bell className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              All Notifications
            </h1>
            <p className="text-sm text-gray-400">
              Stay updated with workspace activities
            </p>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 border border-gray-700 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-200 mb-2">No notifications</h3>
            <p className="text-gray-400 text-center max-w-md">
              You're all caught up! Notifications will appear here when there's activity.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div
                key={n._id}
                className={`group relative bg-gray-900/30 backdrop-blur-sm border rounded-xl p-4 transition-all duration-200 hover:shadow-lg
                  ${
                    n.isRead
                      ? "border-gray-800/50 hover:bg-gray-800/30 hover:border-gray-700/50"
                      : "border-l-2 border-l-indigo-500 bg-indigo-500/5 border-gray-800/50"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      n.isRead
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-indigo-500/10 border-indigo-500/20"
                    }`}
                  >
                    {n.isRead ? (
                      <CheckCheck className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Bell className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm break-words ${n.isRead ? "text-gray-300" : "text-white font-medium"}`}>
                      {n.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}