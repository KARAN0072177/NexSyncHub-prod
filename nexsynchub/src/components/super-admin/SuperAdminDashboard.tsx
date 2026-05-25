"use client";

import {
  motion,
} from "framer-motion";

import {

  Shield,
  Crown,
  Activity,
  AlertTriangle,

} from "lucide-react";

const T = {

  surface:
    "rgba(8,16,40,0.70)",

  border:
    "rgba(99,140,255,0.10)",

  gold:
    "#F59E0B",

  rose:
    "#FB7185",

  violet:
    "#7C3AED",

  cyan:
    "#22D3EE",

  text:
    "#E2E8F8",

  muted:
    "#4A5578",

};

const cards = [

  {

    title:
      "Admin Management",

    description:
      "Promote or demote platform admins.",

    icon:
      Crown,

    color:
      "#F59E0B",

    glow:
      "rgba(245,158,11,0.15)",

    badge:
      "Governance",

  },

  {

    title:
      "Security Center",

    description:
      "Review security and moderation events.",

    icon:
      Shield,

    color:
      "#FB7185",

    glow:
      "rgba(251,113,133,0.15)",

    badge:
      "Security",

  },

  {

    title:
      "Unsafe Media",

    description:
      "Review blocked uploads and moderation evidence.",

    icon:
      AlertTriangle,

    color:
      "#7C3AED",

    glow:
      "rgba(124,58,237,0.15)",

    badge:
      "Moderation",

  },

  {

    title:
      "AI Moderation",

    description:
      "Future AI-assisted moderation systems.",

    icon:
      Activity,

    color:
      "#22D3EE",

    glow:
      "rgba(34,211,238,0.15)",

    badge:
      "AI",

  },

];

export default function
SuperAdminDashboard() {

  return (

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

      className="mt-10"

    >

      {/* Header */}
      <div
        className="flex items-center gap-3 mb-5"
      >

        <div
          className="flex items-center gap-2"
        >

          <div
            className="w-1 h-4 rounded-full"
            style={{
              background:
                `linear-gradient(180deg,#F59E0B,#F97316)`
            }}
          />

          <span
            className="text-xs font-semibold uppercase tracking-widest"
            style={{
              color: T.gold
            }}
          >
            Super Admin Controls
          </span>

        </div>

        <div
          className="flex-1 h-px"
          style={{
            background: T.border
          }}
        />

      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      >

        {

          cards.map((card) => {

            const Icon =
              card.icon;

            return (

              <motion.div

                key={
                  card.title
                }

                whileHover={{
                  y: -4,
                }}

                transition={{
                  duration: 0.2,
                }}

                className="rounded-2xl p-5 cursor-pointer"

                style={{

                  background:
                    T.surface,

                  border:
                    `1px solid ${card.glow}`,

                }}

              >

                {/* Top */}
                <div
                  className="flex items-center justify-between mb-4"
                >

                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{

                      background:
                        `${card.glow}`,

                      border:
                        `1px solid ${card.glow}`,

                    }}
                  >

                    <Icon
                      size={18}
                      style={{
                        color:
                          card.color
                      }}
                    />

                  </div>

                  <span
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{

                      background:
                        `${card.glow}`,

                      color:
                        card.color,

                    }}
                  >
                    {card.badge}
                  </span>

                </div>

                {/* Content */}
                <h3
                  className="text-lg font-bold text-white"
                  style={{
                    fontFamily:
                      "'Sora',sans-serif"
                  }}
                >
                  {card.title}
                </h3>

                <p
                  className="text-sm mt-1"
                  style={{
                    color:
                      T.muted
                  }}
                >
                  {card.description}
                </p>

              </motion.div>

            );

          })

        }

      </div>

    </motion.div>

  );

}