import mongoose, { Schema } from "mongoose";

const mediaSchema = new Schema(
  {
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    caption: { type: String, default: null },
    category: { type: String, required: true, default: "gallery" },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const MODEL = "Media";
export const Media =
  (mongoose.models[MODEL] as mongoose.Model<typeof mediaSchema>) ??
  mongoose.model(MODEL, mediaSchema);
