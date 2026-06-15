"use client";

import {
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  UserPlus,
  Loader2,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  const passwordMatch = form.password === form.confirmPassword;
  const passwordStrength =
    form.password.length >= 8
      ? "strong"
      : form.password.length >= 6
      ? "medium"
      : "weak";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.username.trim().length < 3) {
      setMessage("Username must be at least 3 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setRegistrationDisabled(true);
        } else {
          setMessage(data.error || "Something went wrong");
        }
      } else {
        setIsSubmitted(true);
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (registrationDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-xl opacity-50" />

          <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex p-4 bg-red-500/10 rounded-full border border-red-500/20 mb-4">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
              Registrations Closed
            </h1>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              We are currently not accepting new accounts. Please check back later or contact your platform administrator.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-xl py-3 px-4 font-medium transition-all flex items-center justify-center gap-2 border border-gray-700 shadow-lg"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />

          <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-flex p-4 bg-green-500/10 rounded-full border border-green-500/20 mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
              Check your email 📧
            </h1>
            <p className="text-gray-300 mb-2">
              We sent a verification link to
            </p>
            <p className="text-indigo-400 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg inline-block border border-indigo-500/20">
              {form.email}
            </p>
            <p className="text-sm text-gray-400 mt-4">
              Please verify your email before logging in.
            </p>

            <button
              onClick={() => router.push("/login")}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 mb-4">
              <UserPlus className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
              Create an account
            </h1>
            <p className="text-sm text-gray-400">
              Join your team and start collaborating
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="karan18"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username: e.target.value.toLowerCase().trim(),
                    })
                  }
                  minLength={3}
                  maxLength={20}
                  pattern="[a-z0-9._]+"
                  required
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                3-20 characters. Use lowercase letters, numbers, . or _
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-10 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === "weak"
                          ? "w-1/3 bg-red-500"
                          : passwordStrength === "medium"
                          ? "w-2/3 bg-yellow-500"
                          : "w-full bg-green-500"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 capitalize">{passwordStrength}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full bg-gray-800/50 border rounded-xl pl-10 pr-10 py-3
                    text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 
                    transition-all ${
                      form.confirmPassword && !passwordMatch
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : "border-gray-700 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    }`}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && !passwordMatch && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Error message */}
            {message && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400 text-center">{message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed 
                text-white rounded-xl py-3 px-4 font-medium transition-all flex items-center justify-center gap-2
                shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Login link */}
            <p className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
