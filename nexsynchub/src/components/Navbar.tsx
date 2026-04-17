"use client";

import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const res = await fetch("/api/notification/list");
    const data = await res.json();

    if (res.ok) {
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="relative">
      {/* 🔔 ICON */}
      <button onClick={() => setOpen(!open)} className="relative">
        🔔

        {unread > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">
            {unread}
          </span>
        )}
      </button>

      {/* 📩 DROPDOWN */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow rounded p-3 space-y-2 z-50">
          {notifications.length === 0 && (
            <p className="text-sm text-gray-500">No notifications</p>
          )}

          {notifications.map((n: any) => (
            <div
              key={n._id}
              className={`text-sm p-2 rounded ${
                n.isRead ? "bg-gray-100" : "bg-blue-50"
              }`}
            >
              {n.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}