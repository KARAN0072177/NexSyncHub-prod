"use client";

import {
  Suspense,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Loader2,
  Lock,
  CheckCircle2,
} from "lucide-react";

function ResetPasswordContent() {

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const email =
    searchParams.get(
      "email"
    ) || "";

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // 🔥 Submit
  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setLoading(true);

      setError("");

      try {

        const res =
          await fetch(

            "/api/auth/reset-password",

            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  email,

                  password,

                  confirmPassword,

                }),

            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          setError(
            data.error
          );

          return;

        }

        setSuccess(true);

        // 🔥 Redirect
        setTimeout(() => {

          router.push(
            "/login"
          );

        }, 2500);

      } catch (error) {

        console.error(error);

        setError(
          "Something went wrong"
        );

      } finally {

        setLoading(false);

      }

    };

  return (

    <div
      className="min-h-screen bg-black text-white flex items-center justify-center px-4"
    >

      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8"
      >

        {/* Success */}
        {success ? (

          <div
            className="text-center py-8"
          >

            <div
              className="w-16 h-16 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5"
            >

              <CheckCircle2
                className="w-8 h-8 text-green-400"
              />

            </div>

            <h1
              className="text-3xl font-bold"
            >

              Password Reset Successful

            </h1>

            <p
              className="text-gray-400 mt-3"
            >

              Redirecting to login...

            </p>

          </div>

        ) : (

          <>

            {/* Header */}
            <div
              className="mb-8"
            >

              <div
                className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5"
              >

                <Lock
                  className="w-6 h-6 text-indigo-400"
                />

              </div>

              <h1
                className="text-3xl font-bold"
              >

                Reset Password

              </h1>

              <p
                className="text-gray-400 mt-2"
              >

                Create a new secure password for your account.

              </p>

            </div>

            {/* Form */}
            <form
              onSubmit={
                handleSubmit
              }

              className="space-y-5"
            >

              {/* Password */}
              <div>

                <label
                  className="text-sm text-gray-300 block mb-2"
                >

                  New Password

                </label>

                <input
                  type="password"

                  value={
                    password
                  }

                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }

                  placeholder="••••••••"

                  required

                  className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-indigo-500 transition"
                />

              </div>

              {/* Confirm */}
              <div>

                <label
                  className="text-sm text-gray-300 block mb-2"
                >

                  Confirm Password

                </label>

                <input
                  type="password"

                  value={
                    confirmPassword
                  }

                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }

                  placeholder="••••••••"

                  required

                  className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-indigo-500 transition"
                />

              </div>

              {/* Error */}
              {error && (

                <div
                  className="text-sm text-red-400"
                >

                  {error}

                </div>

              )}

              {/* Submit */}
              <button
                type="submit"

                disabled={
                  loading
                }

                className="w-full h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >

                {loading ? (

                  <>

                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Resetting Password

                  </>

                ) : (

                  "Reset Password"

                )}

              </button>

            </form>

          </>

        )}

      </div>

    </div>

  );

}

export default function
ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
