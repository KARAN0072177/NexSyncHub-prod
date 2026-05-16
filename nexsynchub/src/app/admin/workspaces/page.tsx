"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Building2,
  Users,
  Hash,
  CheckSquare,
} from "lucide-react";

interface Workspace {

  _id: string;

  name: string;

  createdAt: string;

  members: number;

  channels: number;

  tasks: number;

  owner?: {
    username?: string;
    email?: string;
  };

}

export default function AdminWorkspacesPage() {

  const [
    workspaces,
    setWorkspaces,
  ] = useState<
    Workspace[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  // 🔥 Fetch
  useEffect(() => {

    const fetchWorkspaces =
      async () => {

        try {

          const res =
            await fetch(
              "/api/admin/workspaces/list"
            );

          const data =
            await res.json();

          if (res.ok) {

            setWorkspaces(
              data.workspaces
            );

          }

        } catch (error) {

          console.error(
            "FETCH WORKSPACES ERROR:",
            error
          );

        } finally {

          setLoading(false);

        }

      };

    fetchWorkspaces();

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
          Platform Workspaces
        </h1>

        <p
          className="text-gray-400 mt-2"
        >
          Monitor and inspect platform workspaces
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
                Workspace
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Owner
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Members
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Channels
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Tasks
              </th>

              <th
                className="text-left px-6 py-4 text-sm font-medium text-gray-400"
              >
                Created
              </th>

            </tr>

          </thead>

          <tbody>

            {workspaces.map(
              (
                workspace
              ) => (

                <tr
                  key={workspace._id}
                  className="border-b border-gray-800 last:border-none"
                >

                  {/* Workspace */}
                  <td
                    className="px-6 py-5"
                  >

                    <div
                      className="flex items-center gap-4"
                    >

                      <div
                        className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"
                      >

                        <Building2
                          className="w-5 h-5 text-indigo-400"
                        />

                      </div>

                      <div>

                        <p
                          className="font-medium"
                        >
                          {workspace.name}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* Owner */}
                  <td
                    className="px-6 py-5"
                  >

                    <div>

                      <p
                        className="font-medium"
                      >
                        {workspace.owner?.username ||
                          "Unknown"}
                      </p>

                      <p
                        className="text-sm text-gray-400"
                      >
                        {workspace.owner?.email}
                      </p>

                    </div>

                  </td>

                  {/* Members */}
                  <td
                    className="px-6 py-5"
                  >

                    <div
                      className="flex items-center gap-2"
                    >

                      <Users
                        className="w-4 h-4 text-gray-400"
                      />

                      {workspace.members}

                    </div>

                  </td>

                  {/* Channels */}
                  <td
                    className="px-6 py-5"
                  >

                    <div
                      className="flex items-center gap-2"
                    >

                      <Hash
                        className="w-4 h-4 text-gray-400"
                      />

                      {workspace.channels}

                    </div>

                  </td>

                  {/* Tasks */}
                  <td
                    className="px-6 py-5"
                  >

                    <div
                      className="flex items-center gap-2"
                    >

                      <CheckSquare
                        className="w-4 h-4 text-gray-400"
                      />

                      {workspace.tasks}

                    </div>

                  </td>

                  {/* Created */}
                  <td
                    className="px-6 py-5 text-sm text-gray-400"
                  >

                    {new Date(
                      workspace.createdAt
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