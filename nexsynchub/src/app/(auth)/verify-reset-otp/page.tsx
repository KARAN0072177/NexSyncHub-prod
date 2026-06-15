"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Loader2,
  ShieldCheck,
  RefreshCcw,
} from "lucide-react";

function VerifyResetOTPContent() {

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const email =
    searchParams.get(
      "email"
    ) || "";

  const [
    otp,
    setOtp,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    resendLoading,
    setResendLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    countdown,
    setCountdown,
  ] = useState(30);

  // 🔥 Countdown timer
  useEffect(() => {

    if (countdown <= 0)
      return;

    const timer =
      setTimeout(() => {

        setCountdown(
          countdown - 1
        );

      }, 1000);

    return () =>
      clearTimeout(timer);

  }, [countdown]);

  // 🔥 Verify OTP
  const handleVerify =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setLoading(true);

      setError("");

      try {

        const res =
          await fetch(

            "/api/auth/verify-reset-otp",

            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  email,
                  otp,
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

        // ✅ Redirect
        router.push(

          `/reset-password?email=${encodeURIComponent(email)}`

        );

      } catch (error) {

        console.error(error);

        setError(
          "Something went wrong"
        );

      } finally {

        setLoading(false);

      }

    };

  // 🔥 Resend OTP
  const handleResend =
    async () => {

      try {

        setResendLoading(
          true
        );

        setError("");

        const res =
          await fetch(

            "/api/auth/forgot-password",

            {

              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

              },

              body:
                JSON.stringify({

                  email,
                }),

            }
          );

        if (!res.ok) {

          setError(
            "Failed to resend OTP"
          );

          return;

        }

        // 🔥 Reset timer
        setCountdown(30);

      } catch (error) {

        console.error(error);

        setError(
          "Something went wrong"
        );

      } finally {

        setResendLoading(
          false
        );

      }

    };

  return (

    <div
      className="min-h-screen bg-black text-white flex items-center justify-center px-4"
    >

      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8"
      >

        {/* Header */}
        <div
          className="mb-8"
        >

          <div
            className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5"
          >

            <ShieldCheck
              className="w-6 h-6 text-indigo-400"
            />

          </div>

          <h1
            className="text-3xl font-bold"
          >

            Verify OTP

          </h1>

          <p
            className="text-gray-400 mt-2"
          >

            Enter the OTP sent to:

          </p>

          <p
            className="text-indigo-400 mt-1 text-sm"
          >

            {email}

          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={
            handleVerify
          }

          className="space-y-5"
        >

          <div>

            <label
              className="text-sm text-gray-300 block mb-2"
            >

              OTP Code

            </label>

            <input
              type="text"

              value={otp}

              onChange={(e) =>
                setOtp(
                  e.target.value
                )
              }

              placeholder="123456"

              maxLength={6}

              required

              className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 outline-none focus:border-indigo-500 transition tracking-[8px] text-center text-lg"
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

          {/* Verify */}
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

                Verifying

              </>

            ) : (

              "Verify OTP"

            )}

          </button>

        </form>

        {/* Resend */}
        <div
          className="mt-6 text-center"
        >

          {countdown > 0 ? (

            <p
              className="text-sm text-gray-500"
            >

              Resend OTP in{" "}

              {countdown}s

            </p>

          ) : (

            <button
              onClick={
                handleResend
              }

              disabled={
                resendLoading
              }

              className="text-indigo-400 hover:text-indigo-300 transition text-sm font-medium flex items-center justify-center gap-2 mx-auto"
            >

              {resendLoading ? (

                <Loader2
                  size={16}
                  className="animate-spin"
                />

              ) : (

                <RefreshCcw
                  size={16}
                />

              )}

              Resend OTP

            </button>

          )}

        </div>

      </div>

    </div>

  );

}

export default function
VerifyResetOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifyResetOTPContent />
    </Suspense>
  );
}
