import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

import type {
  AiFeatureKey,
  AiUsageScope,
} from "@/lib/billing/plans";

export interface IAIUsage {
  scope: AiUsageScope;
  workspace?: mongoose.Types.ObjectId | null;
  user?: mongoose.Types.ObjectId | null;
  featureKey: AiFeatureKey;
  creditsUsed: number;
  provider: "openai";
  model?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AIUsageSchema =
  new Schema<IAIUsage>(
    {
      scope: {
        type: String,
        enum: [
          "workspace",
          "platform",
        ],
        required: true,
        index: true,
      },

      workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        default: null,
        index: true,
      },

      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      featureKey: {
        type: String,
        required: true,
        index: true,
      },

      creditsUsed: {
        type: Number,
        required: true,
        min: 0,
      },

      provider: {
        type: String,
        enum: ["openai"],
        default: "openai",
      },

      model: {
        type: String,
        default: "",
      },

      metadata: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

AIUsageSchema.index({
  workspace: 1,
  createdAt: -1,
});

AIUsageSchema.index({
  scope: 1,
  createdAt: -1,
});

const AIUsage =
  models.AIUsage ||
  model<IAIUsage>(
    "AIUsage",
    AIUsageSchema
  );

export default AIUsage;
