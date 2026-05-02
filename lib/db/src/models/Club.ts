import mongoose, { Schema } from "mongoose";

const clubSchema = new Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, default: "General" },
  shortDescription: { type: String, default: "" },
  description: { type: String, default: "" },
  logoUrl: { type: String, default: null },
  coverUrl: { type: String, default: null },
  accentColor: { type: String, required: true, default: "#1f4e79" },
  websiteUrl: { type: String, default: null },
  facebookUrl: { type: String, default: null },
  instagramUrl: { type: String, default: null },
});

const MODEL = "Club";
export const Club =
  (mongoose.models[MODEL] as mongoose.Model<typeof clubSchema>) ??
  mongoose.model(MODEL, clubSchema);
