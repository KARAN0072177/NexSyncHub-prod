"use client";

import { useState }
  from "react";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {

  LifeBuoy,
  Send,
  Paperclip,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bug,
  Lightbulb,
  ShieldAlert,
  CreditCard,
  UserCog,
  MessageSquare,

} from "lucide-react";

const categories = [

  {

    value:
      "general",

    label:
      "General Inquiry",

    icon:
      MessageSquare,

  },

  {

    value:
      "bug_report",

    label:
      "Bug Report",

    icon:
      Bug,

  },

  {

    value:
      "feedback",

    label:
      "Feedback",

    icon:
      Lightbulb,

  },

  {

    value:
      "feature_request",

    label:
      "Feature Request",

    icon:
      Lightbulb,

  },

  {

    value:
      "workspace_report",

    label:
      "Workspace Report",

    icon:
      ShieldAlert,

  },

  {

    value:
      "account_support",

    label:
      "Account Support",

    icon:
      UserCog,

  },

  {

    value:
      "billing",

    label:
      "Billing",

    icon:
      CreditCard,

  },

  {

    value:
      "other",

    label:
      "Other",

    icon:
      AlertCircle,

  },

];

export default function SupportPage() {

  const [category,
    setCategory] =
      useState("general");

  const [subject,
    setSubject] =
      useState("");

  const [message,
    setMessage] =
      useState("");

  const [files,
    setFiles] =
      useState<File[]>([]);

  const [loading,
    setLoading] =
      useState(false);

  const [success,
    setSuccess] =
      useState(false);

  const TOKEN = {

    bg:
      "#050507",

    card:
      "rgba(255,255,255,0.04)",

    border:
      "rgba(255,255,255,0.08)",

    text:
      "#FFFFFF",

    muted:
      "rgba(255,255,255,0.62)",

    accent:
      "#A78BFA",

    accentMd:
      "rgba(124,58,237,0.3)",

    accentLo:
      "rgba(124,58,237,0.12)",

  };

  const selectedCategory =
    categories.find(
      (c) =>
        c.value === category
    );

  const submitSupport =
    async () => {

      try {

        setLoading(true);

        const formData =
          new FormData();

        formData.append(
          "category",
          category
        );

        formData.append(
          "subject",
          subject
        );

        formData.append(
          "message",
          message
        );

        files.forEach(
          (file) => {

            formData.append(
              "attachments",
              file
            );

          }
        );

        const res =
          await fetch(
            "/api/support/create",
            {

              method: "POST",

              body:
                formData,

            }
          );

        const data =
          await res.json();

        if (!res.ok) {

          alert(
            data.error
          );

          return;

        }

        setSuccess(true);

        setSubject("");

        setMessage("");

        setFiles([]);

      } catch (error) {

        console.error(
          error
        );

        alert(
          "Failed to submit support request"
        );

      } finally {

        setLoading(false);

      }

    };

  return (

    <main
      className="min-h-screen px-6 py-24 relative overflow-hidden"
      style={{
        background:
          TOKEN.bg,
      }}
    >

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">

        <div
          className="absolute top-[-180px] left-[-120px] w-[380px] h-[380px] rounded-full blur-3xl opacity-20"
          style={{
            background:
              "#7C3AED",
          }}
        />

        <div
          className="absolute bottom-[-180px] right-[-120px] w-[380px] h-[380px] rounded-full blur-3xl opacity-20"
          style={{
            background:
              "#2563EB",
          }}
        />

      </div>

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* Hero */}
        <motion.div

          initial={{
            opacity: 0,
            y: 20,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.5,
          }}

          className="text-center mb-16"

        >

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border text-sm"
            style={{

              background:
                TOKEN.accentLo,

              borderColor:
                TOKEN.accentMd,

              color:
                TOKEN.accent,

            }}
          >

            <LifeBuoy
              size={14}
            />

            NexSyncHub Support

          </div>

          <h1
            className="text-5xl md:text-6xl font-black mb-6 text-white"
            style={{
              fontFamily:
                "'Sora',sans-serif",
            }}
          >

            Help, feedback,
            <br />

            and support.

          </h1>

          <p
            className="max-w-2xl mx-auto text-lg leading-8"
            style={{
              color:
                TOKEN.muted,
            }}
          >

            Report bugs, request features,
            ask questions,
            or contact our support team.

          </p>

        </motion.div>

        {/* Form */}
        <motion.div

          initial={{
            opacity: 0,
            y: 24,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.55,
          }}

          className="rounded-[36px] border p-8 md:p-10"

          style={{

            background:
              TOKEN.card,

            borderColor:
              TOKEN.border,

            backdropFilter:
              "blur(30px)",

          }}
        >

          {/* Category */}
          <div className="mb-8">

            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-4"
              style={{
                color:
                  TOKEN.muted,
              }}
            >

              Support Category

            </label>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

              {categories.map(
                (item) => {

                  const Icon =
                    item.icon;

                  const active =
                    category ===
                    item.value;

                  return (

                    <button

                      key={
                        item.value
                      }

                      onClick={() =>
                        setCategory(
                          item.value
                        )
                      }

                      className="p-4 rounded-2xl text-left transition-all"

                      style={{

                        background:
                          active

                            ? TOKEN.accentLo

                            : "rgba(255,255,255,0.02)",

                        border:
                          `1px solid ${active
                            ? TOKEN.accentMd
                            : TOKEN.border}`,

                      }}
                    >

                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                        style={{

                          background:
                            active

                              ? "rgba(124,58,237,0.2)"

                              : "rgba(255,255,255,0.04)",

                        }}
                      >

                        <Icon
                          size={18}
                          color={
                            active

                              ? TOKEN.accent

                              : "#FFFFFF"
                          }
                        />

                      </div>

                      <p
                        className="text-sm font-semibold"
                        style={{
                          color:
                            active

                              ? TOKEN.accent

                              : TOKEN.text,
                        }}
                      >

                        {item.label}

                      </p>

                    </button>

                  );

                }
              )}

            </div>

          </div>

          {/* Subject */}
          <div className="mb-6">

            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-3"
              style={{
                color:
                  TOKEN.muted,
              }}
            >

              Subject

            </label>

            <input

              value={subject}

              onChange={(e) =>
                setSubject(
                  e.target.value
                )
              }

              placeholder="Enter support subject"

              className="w-full px-5 py-4 rounded-2xl outline-none text-sm"

              style={{

                background:
                  "rgba(255,255,255,0.03)",

                border:
                  `1px solid ${TOKEN.border}`,

                color:
                  TOKEN.text,

              }}
            />

          </div>

          {/* Message */}
          <div className="mb-6">

            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-3"
              style={{
                color:
                  TOKEN.muted,
              }}
            >

              Message

            </label>

            <textarea

              rows={8}

              value={message}

              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }

              placeholder="Describe your issue, feedback, or request..."

              className="w-full px-5 py-4 rounded-2xl outline-none resize-none text-sm"

              style={{

                background:
                  "rgba(255,255,255,0.03)",

                border:
                  `1px solid ${TOKEN.border}`,

                color:
                  TOKEN.text,

              }}
            />

          </div>

          {/* Attachments */}
          <div className="mb-10">

            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-3"
              style={{
                color:
                  TOKEN.muted,
              }}
            >

              Attachments

            </label>

            <label
              className="flex items-center gap-3 px-5 py-4 rounded-2xl cursor-pointer transition-all"
              style={{

                background:
                  "rgba(255,255,255,0.03)",

                border:
                  `1px dashed ${TOKEN.border}`,

              }}
            >

              <Paperclip
                size={16}
              />

              <span
                className="text-sm"
                style={{
                  color:
                    TOKEN.muted,
                }}
              >

                Upload screenshots,
                PDFs, or supporting files

              </span>

              <input

                type="file"

                hidden

                multiple

                accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.docx"

                onChange={(e) => {

                  const selected =
                    Array.from(
                      e.target.files || []
                    );

                  setFiles(
                    selected
                  );

                }}
              />

            </label>

            {/* Files */}
            {files.length > 0 && (

              <div className="mt-4 space-y-3">

                {files.map(
                  (file) => (

                    <div

                      key={file.name}

                      className="flex items-center justify-between px-4 py-3 rounded-2xl"

                      style={{

                        background:
                          "rgba(255,255,255,0.03)",

                        border:
                          `1px solid ${TOKEN.border}`,

                      }}
                    >

                      <div>

                        <p
                          className="text-sm font-medium"
                        >

                          {file.name}

                        </p>

                        <p
                          className="text-xs mt-1"
                          style={{
                            color:
                              TOKEN.muted,
                          }}
                        >

                          {(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)} MB

                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* Submit */}
          <button

            onClick={
              submitSupport
            }

            disabled={
              loading
            }

            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-all active:scale-[0.99] disabled:opacity-60"

            style={{

              background:
                "linear-gradient(135deg,#7C3AED,#4F46E5)",

              boxShadow:
                "0 12px 40px rgba(124,58,237,0.3)",

            }}
          >

            {loading ? (

              <>

                <Loader2
                  size={18}
                  className="animate-spin"
                />

                Sending Request

              </>

            ) : (

              <>

                <Send
                  size={18}
                />

                Submit Support Request

              </>

            )}

          </button>

        </motion.div>

      </div>

      {/* Success Modal */}
      <AnimatePresence>

        {success && (

          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">

            <motion.div

              initial={{
                opacity: 0,
              }}

              animate={{
                opacity: 1,
              }}

              exit={{
                opacity: 0,
              }}

              className="absolute inset-0"

              style={{

                background:
                  "rgba(0,0,0,0.72)",

                backdropFilter:
                  "blur(12px)",

              }}
            />

            <motion.div

              initial={{
                opacity: 0,
                y: 20,
                scale: 0.95,
              }}

              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}

              exit={{
                opacity: 0,
                y: 12,
                scale: 0.95,
              }}

              className="relative w-full max-w-md rounded-[32px] p-8 border text-center"

              style={{

                background:
                  "#0E0D13",

                borderColor:
                  TOKEN.border,

              }}
            >

              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{

                  background:
                    "rgba(16,185,129,0.14)",

                }}
              >

                <CheckCircle2
                  size={38}
                  color="#34D399"
                />

              </div>

              <h3
                className="text-2xl font-black mb-4"
                style={{
                  fontFamily:
                    "'Sora',sans-serif",
                }}
              >

                Request Submitted

              </h3>

              <p
                className="leading-7 text-sm mb-8"
                style={{
                  color:
                    TOKEN.muted,
                }}
              >

                Your support request has been submitted successfully.

                Our team will review it shortly.

              </p>

              <button

                onClick={() =>
                  setSuccess(
                    false
                  )
                }

                className="w-full py-3 rounded-2xl font-semibold text-white"

                style={{

                  background:
                    "linear-gradient(135deg,#7C3AED,#4F46E5)",

                }}
              >

                Done

              </button>

            </motion.div>

          </div>

        )}

      </AnimatePresence>

    </main>
  );
}