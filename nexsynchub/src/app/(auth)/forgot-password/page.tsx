"use client";

import {
  useState,
} from "react";
import Turnstile from "@/components/global/Turnstile";

import {
  useRouter,
} from "next/navigation";

import {
  Loader2,
  Mail,
  ArrowLeft,
} from "lucide-react";

export default function
ForgotPasswordPage() {

  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [turnstileToken, setTurnstileToken] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);

  // 🔥 Submit
  const handleSubmit =
    async (
      e: React.FormEvent
    ) => {

      e.preventDefault();

      setLoading(true);

      setError("");

      setSuccess("");

      try {

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
                  turnstileToken,
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

        setSuccess(
          data.message
        );

        // 🔥 Redirect to OTP
        setTimeout(() => {

          router.push(

            `/verify-reset-otp?email=${encodeURIComponent(email)}`

          );

        }, 1500);

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

        {/* Back */}
        <button
          onClick={() =>
            router.push("/login")
          }

          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-6"
        >

          <ArrowLeft
            size={16}
          />

          Back to login

        </button>

        {/* Header */}
        <div
          className="mb-8"
        >

          <div
            className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5"
          >

            <Mail
              className="w-6 h-6 text-indigo-400"
            />

          </div>

          <h1
            className="text-3xl font-bold"
          >

            Forgot Password

          </h1>

          <p
            className="text-gray-400 mt-2"
          >

            Enter your email to receive a reset OTP.

          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={
            handleSubmit
          }

          className="space-y-5"
        >

          <div>

            <label
              className="text-sm text-gray-300 block mb-2"
            >

              Email Address

            </label>

            <input
              type="email"

              value={email}

              onFocus={() => setShowCaptcha(true)}
              onChange={(e) => {
                setShowCaptcha(true);
                setEmail(
                  e.target.value
                );
              }}

              placeholder="you@example.com"

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

          {/* Success */}
          {success && (

            <div
              className="text-sm text-green-400"
            >

              {success}

            </div>

          )}

          {/* Turnstile Captcha */}
          {showCaptcha && (
            <Turnstile onVerify={(token) => setTurnstileToken(token)} />
          )}

          {/* Submit */}
          <button
            type="submit"

            disabled={
              loading || !turnstileToken
            }

            className="w-full h-12 rounded-2xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >

            {loading ? (

              <>

                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Sending OTP

              </>

            ) : (

              "Send OTP"

            )}

          </button>

        </form>

      </div>

    </div>

  );

}