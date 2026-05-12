"use client";

import { useState, useRef } from "react";
import {
  User,
  Mail,
  Calendar,
  Loader2,
  Save,
  Edit3,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

type ProfileBasicInfoProps = {
  initialProfile: any;
};

export default function ProfileBasicInfo({ initialProfile }: ProfileBasicInfoProps) {
  const [displayName, setDisplayName] = useState(initialProfile.displayName || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(initialProfile.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Upload failed");
        return;
      }
      setAvatar(data.avatar);
      showToast("success", "Avatar updated successfully");
    } catch (error) {
      console.error(error);
      showToast("error", "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Update failed");
        return;
      }
      showToast("success", "Profile updated");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      showToast("error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset fields to original profile values
    setDisplayName(initialProfile.displayName || "");
    setBio(initialProfile.bio || "");
    setIsEditing(false);
  };

  const initials = (initialProfile.displayName || initialProfile.username || "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`absolute top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-slide-in ${
            toast.type === "success"
              ? "bg-emerald-500/20 border border-emerald-400/30 text-emerald-300"
              : "bg-rose-500/20 border border-rose-400/30 text-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle size={18} className="text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="text-rose-400" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-gray-300 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Basic Information</h2>
          <p className="text-sm text-gray-400 mt-1">
            Manage your personal profile and identity across workspaces.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 hover:bg-white/10 transition-all duration-200"
          >
            <Edit3 size={16} />
            Edit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        {/* Left side – Avatar & meta */}
        <div className="bg-gray-950/40 border border-gray-800 rounded-2xl p-5 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-indigo-600/20 shadow-lg shadow-indigo-500/10 group">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-indigo-300">
                  {initials}
                </div>
              )}
              {/* Upload spinner overlay */}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 size={28} className="text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Change Avatar button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/20 hover:border-indigo-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            {uploadingAvatar ? "Uploading..." : "Change Avatar"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarUpload(file);
            }}
          />

          {/* Name & username */}
          <h3 className="mt-4 text-lg font-semibold text-white text-center">
            {initialProfile.displayName || initialProfile.username}
          </h3>
          <p className="text-sm text-gray-500">@{initialProfile.username}</p>

          {/* Meta info */}
          <div className="mt-6 w-full space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-300 break-all">
                  {initialProfile.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Joined</p>
                <p className="text-sm text-gray-300">
                  {new Date(initialProfile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side – Display name & Bio */}
        <div className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            {isEditing ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              />
            ) : (
              <p className="bg-gray-800/20 border border-gray-800 rounded-xl px-4 py-3 text-gray-200 min-h-[48px]">
                {displayName || (
                  <span className="text-gray-500">No display name set</span>
                )}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                placeholder="Tell your team a little about yourself..."
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
              />
            ) : (
              <p className="bg-gray-800/20 border border-gray-800 rounded-xl px-4 py-3 text-gray-200 min-h-[5rem] whitespace-pre-wrap">
                {bio || (
                  <span className="text-gray-500">No bio added yet</span>
                )}
              </p>
            )}
          </div>

          {/* Action buttons (only in edit mode) */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:bg-white/5 disabled:opacity-50 transition-all"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
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
          )}
        </div>
      </div>

      {/* Inline animate-slide-in keyframes */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}