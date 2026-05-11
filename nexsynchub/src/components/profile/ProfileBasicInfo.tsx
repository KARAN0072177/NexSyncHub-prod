"use client";

import { useState } from "react";

import {
  User,
  Mail,
  Calendar,
  Loader2,
  Save,
} from "lucide-react";

type ProfileBasicInfoProps = {
  initialProfile: any;
};

export default function ProfileBasicInfo({
  initialProfile,
}: ProfileBasicInfoProps) {

  const [displayName, setDisplayName] =
    useState(
      initialProfile.displayName || ""
    );

  const [bio, setBio] =
    useState(
      initialProfile.bio || ""
    );

  const [saving, setSaving] =
    useState(false);

  const handleSave = async () => {

    try {

      setSaving(true);

      const res = await fetch(
        "/api/profile/update",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            displayName,
            bio,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Profile updated");

    } catch (error) {

      console.error(error);

      alert("Something went wrong");

    } finally {

      setSaving(false);

    }

  };

  // 🔥 Avatar initials
  const initials =
    (
      initialProfile.displayName ||
      initialProfile.username ||
      "U"
    )
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      className="bg-gray-900/40 border border-gray-800
      rounded-3xl p-6 backdrop-blur-sm"
    >

      {/* Section title */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">
          Basic Information
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Manage your personal profile
          and identity across workspaces.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

        {/* Left side */}
        <div
          className="bg-gray-950/40 border border-gray-800
          rounded-2xl p-5"
        >

          {/* Avatar */}
          <div className="flex flex-col items-center text-center">

            <div
              className="w-24 h-24 rounded-full
              bg-indigo-600/20 border border-indigo-500/30
              flex items-center justify-center
              text-2xl font-bold text-indigo-300"
            >
              {initials}
            </div>

            <h3 className="mt-4 text-lg font-semibold text-white">
              {initialProfile.displayName ||
                initialProfile.username}
            </h3>

            <p className="text-sm text-gray-500">
              @{initialProfile.username}
            </p>

          </div>

          {/* Meta */}
          <div className="mt-6 space-y-4">

            <div className="flex items-start gap-3">
              <Mail
                size={16}
                className="text-gray-500 mt-0.5"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Email
                </p>

                <p className="text-sm text-gray-300 break-all">
                  {initialProfile.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar
                size={16}
                className="text-gray-500 mt-0.5"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Joined
                </p>

                <p className="text-sm text-gray-300">
                  {new Date(
                    initialProfile.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right side */}
        <div className="space-y-5">

          {/* Display name */}
          <div>
            <label
              className="block text-sm font-medium
              text-gray-300 mb-2"
            >
              Display Name
            </label>

            <input
              value={displayName}
              onChange={(e) =>
                setDisplayName(
                  e.target.value
                )
              }
              placeholder="Your display name"
              className="w-full bg-gray-800/50
              border border-gray-700
              rounded-xl px-4 py-3
              text-gray-200
              placeholder:text-gray-500
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500/50
              focus:border-indigo-500/50
              transition-all"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              className="block text-sm font-medium
              text-gray-300 mb-2"
            >
              Bio
            </label>

            <textarea
              value={bio}
              onChange={(e) =>
                setBio(
                  e.target.value
                )
              }
              rows={5}
              placeholder="Tell your team a little about yourself..."
              className="w-full bg-gray-800/50
              border border-gray-700
              rounded-xl px-4 py-3
              text-gray-200
              placeholder:text-gray-500
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500/50
              focus:border-indigo-500/50
              transition-all resize-none"
            />
          </div>

          {/* Save */}
          <div className="flex justify-end">

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2
              px-5 py-3 rounded-xl
              bg-indigo-600 hover:bg-indigo-700
              disabled:opacity-50
              disabled:cursor-not-allowed
              text-white font-medium
              transition-all shadow-lg
              shadow-indigo-600/20"
            >

              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
}