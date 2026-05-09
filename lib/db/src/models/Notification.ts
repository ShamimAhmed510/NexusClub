import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: null },
    read: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const MODEL = "Notification";
export const Notification =
  (mongoose.models[MODEL] as mongoose.Model<typeof notificationSchema>) ??
  mongoose.model(MODEL, notificationSchema);
