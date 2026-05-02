import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
  {
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, default: null },
    venue: { type: String, required: true },
    capacity: { type: Number, default: null },
    coverUrl: { type: String, default: null },
    status: { type: String, required: true, default: "pending" },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedById: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);

const eventRsvpSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false },
  },
);
eventRsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

const EVENT_MODEL = "Event";
const RSVP_MODEL = "EventRsvp";

export const Event =
  (mongoose.models[EVENT_MODEL] as mongoose.Model<typeof eventSchema>) ??
  mongoose.model(EVENT_MODEL, eventSchema);

export const EventRsvp =
  (mongoose.models[RSVP_MODEL] as mongoose.Model<typeof eventRsvpSchema>) ??
  mongoose.model(RSVP_MODEL, eventRsvpSchema);
