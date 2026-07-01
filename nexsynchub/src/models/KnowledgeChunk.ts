import mongoose, { Schema, models, model } from "mongoose";

export interface IKnowledgeChunk {
  chunkId: string;
  source: string;
  section: string;
  heading: string;
  category: string;
  visibility: "public" | "authenticated" | "workspace" | "admin" | "super_admin";
  workspaceId: mongoose.Types.ObjectId | null;
  text: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    chunkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    section: {
      type: String,
      required: true,
    },
    heading: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    visibility: {
      type: String,
      required: true,
      enum: ["public", "authenticated", "workspace", "admin", "super_admin"],
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      default: null,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const KnowledgeChunk =
  models.KnowledgeChunk || model<IKnowledgeChunk>("KnowledgeChunk", KnowledgeChunkSchema);

export default KnowledgeChunk;
