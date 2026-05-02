import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const MODEL = "Post";
export const Post =
  (mongoose.models[MODEL] as mongoose.Model<typeof postSchema>) ??
  mongoose.model(MODEL, postSchema);
