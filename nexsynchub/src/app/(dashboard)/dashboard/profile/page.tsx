"use client";

import { useEffect, useState } from "react";

import {
  Loader2,
  User,
} from "lucide-react";

import ProfileBasicInfo from "@/components/profile/ProfileBasicInfo";

export default function ProfilePage() {

  const [profile, setProfile] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  // 🔥 Fetch profile
  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const res = await fetch(
          "/api/profile/me"
        );

        const data = await res.json();

        if (res.ok) {
          setProfile(data.profile);
        }

      } catch (error) {

        console.error(
          "Profile fetch failed:",
          error
        );

      } finally {

        setLoading(false);

      }

    };

    fetchProfile();

  }, []);

  // 🔥 Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center
        justify-center bg-gradient-to-br
        from-gray-950 via-gray-900 to-gray-950"
      >
        <Loader2
          className="w-8 h-8 text-indigo-500
          animate-spin"
        />
      </div>
    );
  }

  // 🔥 Error state
  if (!profile) {
    return (
      <div
        className="min-h-screen flex items-center
        justify-center bg-gradient-to-br
        from-gray-950 via-gray-900 to-gray-950"
      >

        <div
          className="text-center bg-gray-900/40
          border border-gray-800 rounded-2xl
          p-8"
        >

          <User
            className="w-10 h-10 text-gray-600
            mx-auto mb-4"
          />

          <h2 className="text-lg font-semibold text-white">
            Failed to load profile
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Please try refreshing the page.
          </p>

        </div>

      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br
      from-gray-950 via-gray-900 to-gray-950
      p-6"
    >

      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="mb-8">

          <h1
            className="text-3xl font-bold
            text-white tracking-tight"
          >
            Your Profile
          </h1>

          <p className="text-gray-400 mt-2">
            Manage your identity,
            personalization, and workspace presence.
          </p>

        </div>

        {/* Section 1 */}
        <ProfileBasicInfo
          initialProfile={profile}
        />

      </div>

    </div>
  );
}