"use client";

export default function TaskCard({ task, updateTask }: any) {
  return (
    <div className="bg-white p-3 rounded shadow mb-2">

      <p className="font-medium">{task.title}</p>

      <p className="text-xs text-gray-500">
        {task.assignee?.username || "Unassigned"}
      </p>

      {/* QUICK MOVE BUTTONS */}
      <div className="flex gap-1 mt-2">
        <button
          onClick={() => updateTask(task._id, { status: "todo" })}
          className="text-xs bg-gray-100 px-2 py-1 rounded"
        >
          Todo
        </button>

        <button
          onClick={() => updateTask(task._id, { status: "in-progress" })}
          className="text-xs bg-blue-100 px-2 py-1 rounded"
        >
          Progress
        </button>

        <button
          onClick={() => updateTask(task._id, { status: "done" })}
          className="text-xs bg-green-100 px-2 py-1 rounded"
        >
          Done
        </button>
      </div>

    </div>
  );
}