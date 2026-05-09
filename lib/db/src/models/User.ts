import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, required: true, default: "student" },
    studentId: { type: String, default: null },
    department: { type: String, default: null },
    batch: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const MODEL = "User";
export const User =
  (mongoose.models[MODEL] as mongoose.Model<typeof userSchema>) ??
  mongoose.model(MODEL, userSchema);
