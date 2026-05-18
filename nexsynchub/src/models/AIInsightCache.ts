import mongoose, {
  Schema,
  model,
  models,
} from "mongoose";

const AIInsightCacheSchema =
  new Schema({

    insights: {

      type: String,

      required: true,

    },

    generatedAt: {

      type: Date,

      default: Date.now,

    },

  });

const AIInsightCache =

  models.AIInsightCache ||

  model(
    "AIInsightCache",
    AIInsightCacheSchema
  );

export default
  AIInsightCache;