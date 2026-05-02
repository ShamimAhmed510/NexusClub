import mongoose, { Schema } from "mongoose";

const noticeSchema = new Schema(
  {
    clubId: { type: Schema.Types.ObjectId, ref: "Club", default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    scope: { type: String, required: true, default: "club" },
    pinned: { type: Boolean, required: true, default: false },
    publishAt: { type: Date, required: true, default: () => new Date() },
    expireAt: { type: Date, default: null },
    audienceRole: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const MODEL = "Notice";
export const Notice =
  (mongoose.models[MODEL] as mongoose.Model<typeof noticeSchema>) ??
  mongoose.model(MODEL, noticeSchema);
