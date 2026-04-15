"use client";

import { useEffect, useState } from "react";

export default function ActivityClient({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      const res = await fetch(
        `/api/workspace/activity?workspaceId=${workspaceId}`
      );

      const data = await res.json();

      if (res.ok) {
        setActivities(data.activities);
      }
    };

    fetchActivities();
  }, [workspaceId]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Activity</h1>

      <div className="space-y-3">
        {activities.map((a) => (
          <div
            key={a._id}
            className="bg-gray-900 p-3 rounded text-sm"
          >
            {a.content}

            <div className="text-xs text-gray-500 mt-1">
              Task: {a.task?.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}