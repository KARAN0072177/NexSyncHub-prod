import mongoose, {
  Schema,
  models,
  model,
} from "mongoose";

import type {
  WorkspacePlan,
} from "@/lib/billing/plans";

export interface IWorkspaceBillingRecord {
  workspace: mongoose.Types.ObjectId;
  purchasedBy?: mongoose.Types.ObjectId | null;
  purchasedByEmail?: string;
  purchasedByName?: string;
  plan: WorkspacePlan;
  planName: string;
  billingReason?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeInvoiceId: string;
  stripePriceId?: string;
  invoiceNumber?: string;
  invoicePdfUrl?: string;
  hostedInvoiceUrl?: string;
  amountPaid: number;
  amountDue: number;
  currency: string;
  paymentStatus: string;
  invoiceStatus?: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  paidAt?: Date | null;
  receiptEmailSentAt?: Date | null;
  memberEmailSentAt?: Date | null;
  receiptEmailError?: string;
  memberEmailError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceBillingRecordSchema =
  new Schema<IWorkspaceBillingRecord>(
    {
      workspace: {
        type: Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
      },

      purchasedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },

      purchasedByEmail: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      purchasedByName: {
        type: String,
        trim: true,
        default: "",
      },

      plan: {
        type: String,
        enum: [
          "free",
          "pro",
          "business",
        ],
        required: true,
        index: true,
      },

      planName: {
        type: String,
        required: true,
        trim: true,
      },

      billingReason: {
        type: String,
        default: "",
        trim: true,
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

      stripeInvoiceId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },

      stripePriceId: {
        type: String,
        default: "",
      },

      invoiceNumber: {
        type: String,
        default: "",
      },

      invoicePdfUrl: {
        type: String,
        default: "",
      },

      hostedInvoiceUrl: {
        type: String,
        default: "",
      },

      amountPaid: {
        type: Number,
        default: 0,
      },

      amountDue: {
        type: Number,
        default: 0,
      },

      currency: {
        type: String,
        default: "usd",
        lowercase: true,
        trim: true,
      },

      paymentStatus: {
        type: String,
        default: "paid",
        index: true,
      },

      invoiceStatus: {
        type: String,
        default: "",
      },

      periodStart: {
        type: Date,
        default: null,
      },

      periodEnd: {
        type: Date,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
        index: true,
      },

      receiptEmailSentAt: {
        type: Date,
        default: null,
      },

      memberEmailSentAt: {
        type: Date,
        default: null,
      },

      receiptEmailError: {
        type: String,
        default: "",
      },

      memberEmailError: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

WorkspaceBillingRecordSchema.index({
  workspace: 1,
  paidAt: -1,
});

const WorkspaceBillingRecord =
  models.WorkspaceBillingRecord ||
  model<IWorkspaceBillingRecord>(
    "WorkspaceBillingRecord",
    WorkspaceBillingRecordSchema
  );

export default WorkspaceBillingRecord;
