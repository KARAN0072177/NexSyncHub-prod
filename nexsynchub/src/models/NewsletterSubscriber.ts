import {
  Schema,
  model,
  models,
} from "mongoose";

export type NewsletterSource =
  | "public_site"
  | "workspace"
  | "admin_import"
  | "api"
  | "unknown";

export type NewsletterFrequency =
  | "weekly"
  | "monthly"
  | "critical_only";

export interface INewsletterPreferences {
  frequency: NewsletterFrequency;
  workspaceDigests: boolean;
  aiInsights: boolean;
  operationalSummaries: boolean;
  productUpdates: boolean;
}

export interface INewsletterSubscriber {
  email: string;
  isVerified: boolean;
  isSubscribed: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  unsubscribeToken: string;
  source: NewsletterSource;
  tags: string[];
  preferences: INewsletterPreferences;
  lastEmailSentAt?: Date | null;
  verifiedAt?: Date | null;
  unsubscribedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterPreferencesSchema =
  new Schema<INewsletterPreferences>(
    {
      frequency: {
        type: String,
        enum: [
          "weekly",
          "monthly",
          "critical_only",
        ],
        default: "weekly",
      },
      workspaceDigests: {
        type: Boolean,
        default: true,
      },
      aiInsights: {
        type: Boolean,
        default: true,
      },
      operationalSummaries: {
        type: Boolean,
        default: true,
      },
      productUpdates: {
        type: Boolean,
        default: false,
      },
    },
    {
      _id: false,
    }
  );

const NewsletterSubscriberSchema =
  new Schema<INewsletterSubscriber>(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      isVerified: {
        type: Boolean,
        default: false,
        index: true,
      },
      isSubscribed: {
        type: Boolean,
        default: true,
        index: true,
      },
      verificationToken: {
        type: String,
        index: true,
      },
      verificationTokenExpiresAt: {
        type: Date,
      },
      unsubscribeToken: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      source: {
        type: String,
        enum: [
          "public_site",
          "workspace",
          "admin_import",
          "api",
          "unknown",
        ],
        default: "public_site",
        index: true,
      },
      tags: {
        type: [String],
        default: [],
        index: true,
      },
      preferences: {
        type: NewsletterPreferencesSchema,
        default: () => ({}),
      },
      lastEmailSentAt: {
        type: Date,
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      unsubscribedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

NewsletterSubscriberSchema.index({
  isSubscribed: 1,
  isVerified: 1,
  "preferences.frequency": 1,
});

const NewsletterSubscriber =
  models.NewsletterSubscriber ||
  model<INewsletterSubscriber>(
    "NewsletterSubscriber",
    NewsletterSubscriberSchema
  );

export default NewsletterSubscriber;
