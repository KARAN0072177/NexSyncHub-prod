import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function NotificationsPage() {
  await connectDB();

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  const notifications = await Notification.find({
    user: session.user.id,
  }).sort({ createdAt: -1 });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">All Notifications</h1>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <p className="text-gray-500 text-sm">No notifications</p>
        )}

        {notifications.map((n: any) => (
          <div
            key={n._id}
            className={`p-3 rounded border ${
              n.isRead ? "bg-gray-100" : "bg-blue-50"
            }`}
          >
            <p className="text-sm">{n.content}</p>

            <p className="text-xs text-gray-500 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}