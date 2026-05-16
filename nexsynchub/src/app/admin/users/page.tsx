"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Shield,
  Crown,
  BadgeCheck,
} from "lucide-react";

interface User {

  _id: string;

  username?: string;

  email: string;

  role: string;

  avatar?: string;

  isEmailVerified: boolean;

  createdAt: string;

}

export default function AdminUsersPage() {

  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  // 🔥 Fetch users
  useEffect(() => {

    const fetchUsers =
      async () => {

        try {

          const res =
            await fetch(
              "/api/admin/users/list"
            );

          const data =
            await res.json();

          if (res.ok) {

            setUsers(
              data.users
            );

          }

        } catch (error) {

          console.error(
            "FETCH USERS ERROR:",
            error
          );

        } finally {

          setLoading(false);

        }

      };

    fetchUsers();

  }, []);

  if (loading) {

    return (

      <div
        className="h-full flex items-center justify-center"
      >

        <Loader2
          className="w-10 h-10 text-indigo-500 animate-spin"
        />

      </div>

    );

  }

  return (

    <div
      className="p-6 text-white"
    >

      {/* Header */}
      <div
        className="mb-8"
      >

        <h1
          className="text-3xl font-bold"
        >
          Platform Users
        </h1>

        <p
          className="text-gray-400 mt-2"
        >
          Manage and monitor platform users
        </p>

      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900"
      >

        <table
          className="w-full"
        >

          <thead
            className="bg-gray-950 border-b border-gray-800"
          >

            <tr>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                User
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Role
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Verified
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Joined
              </th>

            </tr>

          </thead>

          <tbody>

            {users.map(
              (user) => (

                <tr
                  key={user._id}
                  className="border-b border-gray-800 last:border-none"
                >

                  {/* User */}
                  <td
                    className="px-6 py-5"
                  >

                    <div
                      className="flex items-center gap-4"
                    >

                      {/* Avatar */}
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username || "User"} className="w-11 h-11 rounded-full object-cover border border-indigo-500/20 shrink-0" />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-semibold text-indigo-400 shrink-0"
                          >
                            {user.username?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}

                      {/* Info */}
                      <div>

                        <p
                          className="font-medium"
                        >
                          {user.username ||
                            "Unnamed"}
                        </p>

                        <p
                          className="text-sm text-gray-400"
                        >
                          {user.email}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* Role */}
                  <td
                    className="px-6 py-5"
                  >

                    <div
                      className="flex items-center gap-2"
                    >

                      {user.role ===
                        "super_admin" && (

                        <>

                          <Crown
                            className="w-4 h-4 text-yellow-400"
                          />

                          <span>
                            Super Admin
                          </span>

                        </>

                      )}

                      {user.role ===
                        "admin" && (

                        <>

                          <Shield
                            className="w-4 h-4 text-indigo-400"
                          />

                          <span>
                            Admin
                          </span>

                        </>

                      )}

                      {user.role ===
                        "user" && (
                        <span>
                          User
                        </span>
                      )}

                    </div>

                  </td>

                  {/* Verified */}
                  <td
                    className="px-6 py-5"
                  >

                    {user.isEmailVerified ? (

                      <BadgeCheck
                        className="w-5 h-5 text-green-400"
                      />

                    ) : (

                      <span
                        className="text-gray-500"
                      >
                        No
                      </span>

                    )}

                  </td>

                  {/* Joined */}
                  <td
                    className="px-6 py-5 text-sm text-gray-400"
                  >

                    {new Date(
                      user.createdAt
                    ).toLocaleDateString()}

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

    </div>

  );

}