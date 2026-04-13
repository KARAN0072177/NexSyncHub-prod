"use client";

import { useEffect, useState } from "react";

type Task = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdBy?: { username: string };
  assignee?: { username: string };
};

export default function TasksClient({ workspaceId }: { workspaceId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await fetch(
        `/api/task/list?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (res.ok) {
        setTasks(data.tasks);
      }

      setLoading(false);
    };

    fetchTasks();
  }, [workspaceId]);

  if (loading) return <div className="p-6">Loading tasks...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Tasks</h1>

      {tasks.length === 0 && (
        <div className="text-gray-500">No tasks yet</div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task._id}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            {/* LEFT */}
            <div>
              <p className="font-medium">{task.title}</p>

              <p className="text-xs text-gray-500">
                Created by {task.createdBy?.username || "Unknown"}
              </p>

              {task.assignee && (
                <p className="text-xs text-gray-500">
                  Assigned to {task.assignee.username}
                </p>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">

              {/* STATUS */}
              <span
                className={`text-xs px-2 py-1 rounded ${
                  task.status === "todo"
                    ? "bg-gray-100 text-gray-700"
                    : task.status === "in-progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {task.status}
              </span>

              {/* PRIORITY */}
              <span
                className={`text-xs px-2 py-1 rounded ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : task.priority === "medium"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}