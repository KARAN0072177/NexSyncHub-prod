"use client";

import { useEffect, useState } from "react";

type Member = {
  user: {
    _id: string;
    username: string;
  };
};

type Task = {
  _id: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  createdBy?: { username: string };
  assignee?: { _id: string; username: string };
};

export default function TasksClient({ workspaceId }: { workspaceId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // 📩 Fetch tasks
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

  // 👥 Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(
        `/api/workspace/members?workspaceId=${workspaceId}`
      );
      const data = await res.json();

      if (res.ok) {
        setMembers(data.members);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  // 🔥 UNIVERSAL UPDATE FUNCTION
  const updateTask = async (
    taskId: string,
    updates: {
      status?: "todo" | "in-progress" | "done";
      assignee?: string;
    }
  ) => {
    const res = await fetch("/api/task/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskId,
        ...updates,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    // 🔥 Smart UI update
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id !== taskId) return t;

        return {
          ...t,
          ...(updates.status && { status: updates.status }),
          ...(updates.assignee && {
            assignee: members
              .map((m) => m.user)
              .find((u) => u._id === updates.assignee),
          }),
        };
      })
    );
  };

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

              {/* 🔥 ASSIGNEE DROPDOWN */}
              <select
                className="border p-1 rounded text-xs mt-2"
                value={task.assignee?._id || ""}
                onChange={(e) =>
                  updateTask(task._id, {
                    assignee: e.target.value,
                  })
                }
              >
                <option value="">Unassigned</option>

                {members.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.username}
                  </option>
                ))}
              </select>
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

              {/* 🔥 STATUS BUTTONS */}
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    updateTask(task._id, { status: "todo" })
                  }
                  className="text-xs px-2 py-1 bg-gray-100 rounded"
                >
                  Todo
                </button>

                <button
                  onClick={() =>
                    updateTask(task._id, { status: "in-progress" })
                  }
                  className="text-xs px-2 py-1 bg-blue-100 rounded"
                >
                  In Progress
                </button>

                <button
                  onClick={() =>
                    updateTask(task._id, { status: "done" })
                  }
                  className="text-xs px-2 py-1 bg-green-100 rounded"
                >
                  Done
                </button>
              </div>

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