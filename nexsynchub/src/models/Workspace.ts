import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

import type {
  SubscriptionStatus,
  WorkspacePlan,
} from "@/lib/billing/plans";

export interface IWorkspace {

  name: string;

  avatar?: string;

  description?: string;

  owner: mongoose.Types.ObjectId;

  isPrivate: boolean;

  plan: WorkspacePlan;

  subscriptionStatus: SubscriptionStatus;

  stripeCustomerId?: string;

  stripeSubscriptionId?: string;

  stripePriceId?: string;

  currentPeriodStart?: Date | null;

  currentPeriodEnd?: Date | null;

  cancelAtPeriodEnd: boolean;

  createdAt: Date;

  updatedAt: Date;

}

const WorkspaceSchema =
  new Schema<IWorkspace>(
    {

      name: {
        type: String,
        required: true,
        trim: true,
      },

      avatar: {
        type: String,
        default: "",
      },

      description: {
        type: String,
        default: "",
      },

      owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      isPrivate: {
        type: Boolean,
        default: true,
      },

      plan: {
        type: String,
        enum: [
          "free",
          "pro",
          "business",
        ],
        default: "free",
        index: true,
      },

      subscriptionStatus: {
        type: String,
        enum: [
          "free",
          "active",
          "trialing",
          "past_due",
          "canceled",
          "incomplete",
        ],
        default: "free",
        index: true,
      },

      stripeCustomerId: {
        type: String,
        default: "",
        index: true,
      },

      stripeSubscriptionId: {
        type: String,
        default: "",
        index: true,
      },

      stripePriceId: {
        type: String,
        default: "",
      },

      currentPeriodStart: {
        type: Date,
        default: null,
      },

      currentPeriodEnd: {
        type: Date,
        default: null,
      },

      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },

    },
    {
      timestamps: true,
    }
  );

const Workspace =
  models.Workspace ||

  model<IWorkspace>(
    "Workspace",
    WorkspaceSchema
  );

export default Workspace;
