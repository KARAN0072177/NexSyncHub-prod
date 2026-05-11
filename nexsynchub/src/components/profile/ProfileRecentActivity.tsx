import {
  CheckCircle2,
  MessageSquare,
  Activity,
} from "lucide-react";

type ActivityItem = {
  type: "task" | "message";
  title: string;
  createdAt: string;
};

type ProfileRecentActivityProps = {
  activity: ActivityItem[];
};

export default function ProfileRecentActivity({
  activity,
}: ProfileRecentActivityProps) {

  const formatTime = (dateString: string) => {

    const date = new Date(dateString);

    const now = new Date();

    const diffMs =
      now.getTime() - date.getTime();

    const diffMins = Math.floor(
      diffMs / (1000 * 60)
    );

    if (diffMins < 1) {
      return "Just now";
    }

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }

    const diffHours = Math.floor(
      diffMins / 60
    );

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(
      diffHours / 24
    );

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString();

  };

  return (
    <div
      className="bg-gray-900/40 border border-gray-800
      rounded-3xl p-6 backdrop-blur-sm"
    >

      {/* Header */}
      <div className="mb-6">

        <h2 className="text-xl font-semibold text-white">
          Recent Activity
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Your latest collaboration and productivity updates.
        </p>

      </div>

      {/* Empty state */}
      {activity.length === 0 ? (

        <div
          className="border border-dashed border-gray-800
          rounded-2xl p-10 text-center"
        >

          <Activity
            className="w-10 h-10 text-gray-600
            mx-auto mb-4"
          />

          <h3 className="text-lg font-medium text-gray-300">
            No recent activity
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Your recent tasks and messages
            will appear here.
          </p>

        </div>

      ) : (

        <div className="space-y-3">

          {activity.map((item, index) => {

            const isTask =
              item.type === "task";

            return (
              <div
                key={index}
                className="flex items-start gap-4
                bg-gray-950/40 border border-gray-800
                rounded-2xl p-4"
              >

                {/* Icon */}
                <div
                  className={`w-11 h-11 rounded-xl
                  flex items-center justify-center border
                  ${
                    isTask
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-indigo-500/10 border-indigo-500/20"
                  }`}
                >

                  {isTask ? (

                    <CheckCircle2
                      className="w-5 h-5 text-green-400"
                    />

                  ) : (

                    <MessageSquare
                      className="w-5 h-5 text-indigo-400"
                    />

                  )}

                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">

                  <p className="text-sm text-gray-200 break-words">
                    {item.title}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(item.createdAt)}
                  </p>

                </div>

              </div>
            );

          })}

        </div>

      )}

    </div>
  );
}