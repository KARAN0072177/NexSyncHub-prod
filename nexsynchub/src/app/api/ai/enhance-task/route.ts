import { handleApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth-guard";
import Task from "@/models/Task";
import Membership from "@/models/Membership";
import {
  AI_FEATURE_CREDITS,
} from "@/lib/billing/plans";
import {
  assertWorkspaceAiQuota,
  isAiQuotaExceededError,
  recordAiUsage,
} from "@/lib/billing/ai-usage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    await connectDB();

    const session =
      await requireAuth();
    const {
      taskId,
      text,
    } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json(
        {
          error: "Text is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !taskId ||
      !mongoose.Types.ObjectId.isValid(
        taskId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Task context is required for workspace AI usage.",
        },
        {
          status: 400,
        }
      );
    }

    const task =
      await Task.findById(
        taskId
      )
        .select("workspace")
        .lean<{
          workspace: mongoose.Types.ObjectId;
        } | null>();

    if (!task) {
      return NextResponse.json(
        {
          error: "Task not found",
        },
        {
          status: 404,
        }
      );
    }

    const workspaceId =
      String(task.workspace);
    const membership =
      await Membership.findOne({
        workspace: workspaceId,
        user: session.user.id,
      })
        .select("_id")
        .lean();

    if (!membership) {
      return NextResponse.json(
        {
          error: "Access denied",
        },
        {
          status: 403,
        }
      );
    }

    const credits =
      AI_FEATURE_CREDITS.task_description_enhance;

    await assertWorkspaceAiQuota({
      workspaceId,
      credits,
    });

    const systemPrompt = `
You are an expert project manager's assistant. Your task is to refine a raw task description into a clear, concise, and actionable format.

Follow these rules for the output:
1.  **Summary:** Start with a single, impactful sentence that summarizes the core goal of the task.
2.  **Key Objectives/Steps:** Use a markdown bulleted list (using '-') for the main objectives or action items.
3.  **Concise:** Keep the entire output brief and to the point. Avoid jargon and unnecessary words.
4.  **Format:** Use only markdown for formatting. Do not use headings.

Example Input:
"we need to fix the login page, it's not working on mobile and also the password reset is broken. users are complaining. also maybe update the button colors to match the new branding."

Example Output:
Resolve critical login issues and update UI to align with new branding.
- Fix login functionality on mobile devices.
- Repair the broken password reset flow.
- Update button colors to match the new brand guidelines.
`;

    const model =
      "gpt-4o-mini";

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Refine this task description: "${text}"` },
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    const enhancedText = completion.choices[0].message.content?.trim();

    await recordAiUsage({
      scope: "workspace",
      workspaceId,
      userId: session.user.id,
      featureKey: "task_description_enhance",
      creditsUsed: credits,
      model,
      metadata: {
        taskId,
      },
    });

    return NextResponse.json({
      text: enhancedText,
      creditsUsed: credits,
    });

  } catch (error) {
    if (isAiQuotaExceededError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          usage: error.usage,
        },
        {
          status: error.status,
        }
      );
    }

    console.error("AI ENHANCE API ERROR:", error);

    return handleApiError(
      error
    );
  }
}
