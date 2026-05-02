import mongoose, { Schema } from "mongoose";

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    role: { type: String, required: true, default: "member" },
    joinedAt: { type: Date, required: true, default: () => new Date() },
  },
);
membershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });

const joinRequestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    message: { type: String, default: null },
    status: { type: String, required: true, default: "pending" },
    decidedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const MEM_MODEL = "Membership";
const REQ_MODEL = "JoinRequest";

export const Membership =
  (mongoose.models[MEM_MODEL] as mongoose.Model<typeof membershipSchema>) ??
  mongoose.model(MEM_MODEL, membershipSchema);

export const JoinRequest =
  (mongoose.models[REQ_MODEL] as mongoose.Model<typeof joinRequestSchema>) ??
  mongoose.model(REQ_MODEL, joinRequestSchema);
