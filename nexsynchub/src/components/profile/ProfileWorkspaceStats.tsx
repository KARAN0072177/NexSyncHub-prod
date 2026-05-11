import {
  Building2,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  ArrowRight,
  Hash,
} from "lucide-react";

type ProfileWorkspaceStatsProps = {
  workspaces: any[];
  stats: {
    workspaceCount: number;
    tasksCompleted: number;
    tasksAssigned: number;
    messagesSent: number;
  };
};

export default function ProfileWorkspaceStats({
  workspaces,
  stats,
}: ProfileWorkspaceStatsProps) {

  const statCards = [
    {
      label: "Workspaces",
      value: stats.workspaceCount,
      icon: Building2,
    },
    {
      label: "Tasks Completed",
      value: stats.tasksCompleted,
      icon: CheckCircle2,
    },
    {
      label: "Tasks Assigned",
      value: stats.tasksAssigned,
      icon: ClipboardList,
    },
    {
      label: "Messages Sent",
      value: stats.messagesSent,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">

      {/* Workspaces */}
      <div
        className="bg-gray-900/40 border border-gray-800
        rounded-3xl p-6 backdrop-blur-sm"
      >

        {/* Header */}
        <div className="mb-6">

          <h2 className="text-xl font-semibold text-white">
            Your Workspaces
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Spaces where you collaborate
            and contribute.
          </p>

        </div>

        {/* Workspace list */}
        <div className="space-y-3">

          {workspaces.length === 0 ? (

            <div
              className="border border-dashed border-gray-800
              rounded-2xl p-8 text-center"
            >

              <Building2
                className="w-10 h-10 text-gray-600
                mx-auto mb-3"
              />

              <p className="text-gray-400">
                No workspaces yet
              </p>

            </div>

          ) : (

            workspaces.map((ws) => (

              <div
                key={ws._id}
                className="group flex items-center justify-between
                bg-gray-950/40 border border-gray-800
                rounded-2xl p-4 hover:border-indigo-500/30
                transition-all"
              >

                {/* Left */}
                <div className="flex items-center gap-4">

                  <div
                    className="w-11 h-11 rounded-xl
                    bg-indigo-500/10 border border-indigo-500/20
                    flex items-center justify-center"
                  >
                    <Hash
                      className="w-5 h-5 text-indigo-400"
                    />
                  </div>

                  <div>

                    <h3
                      className="font-medium text-gray-200
                      group-hover:text-white transition-colors"
                    >
                      {ws.name}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      Role: {ws.role}
                    </p>

                  </div>

                </div>

                {/* Right */}
                <ArrowRight
                  className="w-5 h-5 text-gray-600
                  group-hover:text-indigo-400
                  group-hover:translate-x-0.5
                  transition-all"
                />

              </div>

            ))

          )}

        </div>

      </div>

      {/* Productivity */}
      <div
        className="bg-gray-900/40 border border-gray-800
        rounded-3xl p-6 backdrop-blur-sm"
      >

        {/* Header */}
        <div className="mb-6">

          <h2 className="text-xl font-semibold text-white">
            Productivity Insights
          </h2>

          <p className="text-sm text-gray-400 mt-1">
            Your activity and collaboration stats.
          </p>

        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">

          {statCards.map((stat) => {

            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="bg-gray-950/40 border border-gray-800
                rounded-2xl p-5"
              >

                <div
                  className="w-10 h-10 rounded-xl
                  bg-indigo-500/10 border border-indigo-500/20
                  flex items-center justify-center mb-4"
                >
                  <Icon
                    className="w-5 h-5 text-indigo-400"
                  />
                </div>

                <p
                  className="text-2xl font-bold text-white"
                >
                  {stat.value}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  {stat.label}
                </p>

              </div>
            );

          })}

        </div>

      </div>

    </div>
  );
}