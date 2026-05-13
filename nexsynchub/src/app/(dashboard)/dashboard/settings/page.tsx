// note : this is just a placeholder page to show the settings layout and design. The actual settings content is not implemented yet, so it won't have any real functionality. The focus is on the UI/UX and structure of the settings page.

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  Puzzle,
  CreditCard,
  ChevronRight,
  Save,
  Moon,
  Sun,
  Monitor,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

// -----------------------------------------------
// Tab configuration – easily extensible
// -----------------------------------------------
const SETTINGS_TABS = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "billing", label: "Billing", icon: CreditCard },
];

// -----------------------------------------------
// Tiny helpers & dummy data
// -----------------------------------------------
const demoUser = {
  name: "Alex Johnson",
  email: "alex@nexsynchub.com",
  avatar: "", // using initials fallback
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  // Some state for toggles/inputs (purely visual demo)
  const [darkMode, setDarkMode] = useState("system");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-indigo-400" />
            Settings
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your workspace, notifications, and account preferences.
          </p>
        </motion.div>

        {/* Main layout: sidebar + content */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/40 border border-gray-800 rounded-3xl p-4 backdrop-blur-sm h-fit lg:sticky lg:top-6"
          >
            <nav className="space-y-1">
              {SETTINGS_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600/20 border border-indigo-500/30 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                    {isActive && (
                      <ChevronRight size={16} className="ml-auto text-indigo-400" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Current workspace preview */}
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                Current Workspace
              </p>
              <div className="bg-gray-950/50 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-400">NX</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">NexSyncHub</p>
                  <p className="text-xs text-gray-500">Pro Team</p>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Content panel */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm"
          >
            {/* Account Settings */}
            {activeTab === "account" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={User}
                  title="Account"
                  description="Update your email, display name, and workspace role."
                />
                <div className="grid gap-6 max-w-2xl">
                  <FormField label="Display Name" id="name" defaultValue={demoUser.name} />
                  <FormField label="Email" id="email" type="email" defaultValue={demoUser.email} />
                  <FormField label="Workspace Role" id="role" disabled defaultValue="Owner" />
                  <div className="flex justify-end">
                    <SaveButton />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeTab === "notifications" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={Bell}
                  title="Notifications"
                  description="Choose how and when you want to be notified."
                />
                <div className="space-y-6 max-w-xl">
                  <ToggleRow
                    icon={MailIconPlaceholder}
                    label="Email Notifications"
                    description="Receive activity summaries via email."
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                  />
                  <ToggleRow
                    icon={Bell}
                    label="Push Notifications"
                    description="Get real‑time alerts in your browser."
                    checked={pushNotifications}
                    onChange={setPushNotifications}
                  />
                  <div className="flex justify-end">
                    <SaveButton />
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === "appearance" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={Palette}
                  title="Appearance"
                  description="Personalize your NexSyncHub interface."
                />
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "light", label: "Light", icon: Sun },
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "system", label: "System", icon: Monitor },
                      ].map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => setDarkMode(theme.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                              darkMode === theme.id
                                ? "border-indigo-500/40 bg-indigo-600/10 text-white"
                                : "border-gray-800 bg-gray-950/40 text-gray-400 hover:border-gray-700"
                            }`}
                          >
                            <Icon size={20} />
                            <span className="text-xs">{theme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton />
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={Shield}
                  title="Security"
                  description="Protect your account with extra layers of security."
                />
                <div className="space-y-6 max-w-xl">
                  <ToggleRow
                    icon={Lock}
                    label="Two‑Factor Authentication"
                    description="Add an extra step to verify your identity."
                    checked={twoFactor}
                    onChange={setTwoFactor}
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-3 block">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        readOnly
                        value="nx_live_a1b2c3d4e5f6g7h8i9j0"
                        className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 pr-12 text-sm"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Use this key to interact with the NexSyncHub API.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton />
                  </div>
                </div>
              </div>
            )}

            {/* Integrations */}
            {activeTab === "integrations" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={Puzzle}
                  title="Integrations"
                  description="Connect your favorite tools to NexSyncHub."
                />
                <div className="grid gap-4 max-w-xl">
                  {["Slack", "Notion", "Google Drive", "GitHub"].map((app) => (
                    <div
                      key={app}
                      className="flex items-center justify-between bg-gray-950/40 border border-gray-800 rounded-xl p-4 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-300 text-xs font-bold">
                          {app.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{app}</p>
                          <p className="text-xs text-gray-500">
                            Connect {app} to sync messages & documents.
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-white/5 border border-gray-700 text-xs font-medium text-gray-300 hover:bg-white/10 transition-all">
                        Connect
                      </button>
                    </div>
                  ))}
                  <div className="border border-dashed border-gray-700 rounded-xl p-4 flex items-center justify-center text-gray-500 hover:text-indigo-400 cursor-pointer transition-all">
                    <Plus size={18} className="mr-2" />
                    <span className="text-sm">Request an integration</span>
                  </div>
                </div>
              </div>
            )}

            {/* Billing */}
            {activeTab === "billing" && (
              <div className="space-y-8">
                <SectionHeader
                  icon={CreditCard}
                  title="Billing & Plans"
                  description="Manage your subscription and payment methods."
                />
                <div className="max-w-2xl space-y-6">
                  <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-lg font-semibold text-white">Pro Team</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Unlimited workspaces, AI assistant, priority support.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                        Active
                      </span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all">
                        Upgrade Plan
                      </button>
                      <button className="px-5 py-2 rounded-xl bg-white/5 border border-gray-700 text-gray-300 text-sm hover:bg-white/10 transition-all">
                        Cancel Plan
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-950/40 border border-gray-800 rounded-xl p-4">
                    <CreditCard className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-white">Visa ending in 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/26</p>
                    </div>
                    <button className="ml-auto text-xs text-gray-400 hover:text-white flex items-center gap-1">
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------
// Reusable sub-components
// -----------------------------------------------
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function FormField({
  label,
  id,
  type = "text",
  disabled = false,
  defaultValue,
}: {
  label: string;
  id: string;
  type?: string;
  disabled?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        disabled={disabled}
        defaultValue={defaultValue}
        className={`w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  description: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-800/50 flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-gray-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-gray-700"
        }`}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function SaveButton() {
  return (
    <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]">
      <Save size={16} />
      Save Changes
    </button>
  );
}

// Tiny placeholder to avoid missing icon
function MailIconPlaceholder() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-300"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}