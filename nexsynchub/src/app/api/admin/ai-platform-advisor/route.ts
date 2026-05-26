// app/api/admin/ai-platform-advisor/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import { requireSuperAdmin } from "@/lib/super-admin";
import { handleApiError } from "@/lib/api-error";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import Invite from "@/models/Invite";
import SecurityLog from "@/models/SecurityLog";
import PlatformSettings from "@/models/PlatformSettings"; // adjust import based on your actual model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI operational governance advisor for NexSyncHub, a collaboration platform.

You will receive:
- "metrics": recent 24h activity (unsafe uploads, bans, new users, new workspaces, new invites).
- "totals": overall counts (total users, total workspaces).
- "currentSettings": current boolean values for the four platform controls.

Available settings and their meanings:
- "allowRegistrations": whether new user sign-ups are allowed.
- "maintenanceMode": whether the platform is in maintenance (only super admins can access).
- "allowWorkspaceCreation": whether users can create new workspaces.
- "allowWorkspaceInvites": whether users can send workspace invitations.

For each setting, evaluate if a change is beneficial based on:
- Security risk (high unsafe uploads or bans → consider restricting registrations/workspace creation/invites or enabling maintenance).
- Growth trends (rapid new user/workspace influx → ensure controls are permissive unless security issues exist).
- Current state (if a setting is already off, only recommend turning it on if conditions are safe).
- Default posture: only recommend changes when clearly justified.

Return ONLY valid JSON in this exact format:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "summary": "concise operational summary (1-2 sentences)",
  "recommendations": [
    {
      "setting": "setting name (one of the four)",
      "recommendedValue": true or false,
      "reason": "explanation tied to the metrics"
    }
  ]
}

- "riskLevel" should reflect the overall platform health based on security events and growth anomalies.
- "summary" gives a high-level insight.
- "recommendations": can be empty if no changes are needed. Each recommendation must be for one of the four settings. Include the current value in the reason for context.
- Do NOT recommend changing a setting to the same value it already has.
- Balance safety with usability. Only propose maintenance mode if there is a critical security incident (e.g., many bans + unsafe uploads).
- If recent activity is normal, say "low" risk and provide no recommendations.`;

export async function POST() {
  try {
    await connectDB();

    // Auth & super admin check
    const session = await requireAuth();
    await requireSuperAdmin(session.user.id);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 24h metrics
    const [unsafeUploads24h, recentBans24h, newUsers24h, workspaceCreations24h, inviteCreations24h] =
      await Promise.all([
        SecurityLog.countDocuments({
          action: {
            $in: [
              "unsafe_avatar_upload",
              "unsafe_workspace_avatar_upload",
              "unsafe_support_attachment",
              "unsafe_chat_attachment",
            ],
          },
          createdAt: { $gte: last24h },
        }),
        SecurityLog.countDocuments({
          action: { $in: ["user_temp_banned", "user_permanently_banned"] },
          createdAt: { $gte: last24h },
        }),
        User.countDocuments({ createdAt: { $gte: last24h } }),
        Workspace.countDocuments({ createdAt: { $gte: last24h } }),
        Invite.countDocuments({ createdAt: { $gte: last24h } }),
      ]);

    // Totals (for growth context)
    const [totalUsers, totalWorkspaces] = await Promise.all([
      User.countDocuments(),
      Workspace.countDocuments(),
    ]);

    // Current settings
    const currentSettings = await PlatformSettings.findOne().lean();
    const currentValues = currentSettings
      ? {
          allowRegistrations: currentSettings.allowRegistrations,
          maintenanceMode: currentSettings.maintenanceMode,
          allowWorkspaceCreation: currentSettings.allowWorkspaceCreation,
          allowWorkspaceInvites: currentSettings.allowWorkspaceInvites,
        }
      : {
          allowRegistrations: true,
          maintenanceMode: false,
          allowWorkspaceCreation: true,
          allowWorkspaceInvites: true,
        };

    const userContent = JSON.stringify({
      metrics: {
        unsafeUploads24h,
        recentBans24h,
        newUsers24h,
        workspaceCreations24h,
        inviteCreations24h,
      },
      totals: {
        totalUsers,
        totalWorkspaces,
      },
      currentSettings: currentValues,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    let aiResponse: any = {};
    const rawContent = completion.choices[0]?.message?.content || "{}";
    try {
      aiResponse = JSON.parse(rawContent);
    } catch {
      aiResponse = { riskLevel: "low", summary: "Unable to parse AI response.", recommendations: [] };
    }

    // Normalize and validate the response
    const normalized = {
      riskLevel: ["low", "medium", "high", "critical"].includes(aiResponse.riskLevel)
        ? aiResponse.riskLevel
        : "low",
      summary: aiResponse.summary || "No summary available.",
      recommendations: (aiResponse.recommendations || []).filter(
        (rec: any) =>
          rec.setting &&
          ["allowRegistrations", "maintenanceMode", "allowWorkspaceCreation", "allowWorkspaceInvites"].includes(
            rec.setting
          ) &&
          typeof rec.recommendedValue === "boolean" &&
          rec.reason &&
          // Ensure it's not a redundant suggestion
          (currentValues as any)[rec.setting] !== rec.recommendedValue
      ),
    };

    return NextResponse.json({
      success: true,
      analysis: normalized,
    });
  } catch (error) {
    console.error("AI PLATFORM ADVISOR ERROR:", error);
    return handleApiError(error);
  }
}