export { connectDB } from "./connection.js";
export { User } from "./models/User.js";
export { Club } from "./models/Club.js";
export { Event, EventRsvp } from "./models/Event.js";
export { Membership, JoinRequest } from "./models/Membership.js";
export { Notice } from "./models/Notice.js";
export { Post } from "./models/Post.js";
export { Media } from "./models/Media.js";

export type UserShape = {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string;
  role: string;
  studentId: string | null;
  department: string | null;
  batch: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export type ClubShape = {
  id: string;
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  logoUrl: string | null;
  coverUrl: string | null;
  accentColor: string;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
};

export type EventShape = {
  id: string;
  clubId: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  venue: string;
  capacity: number | null;
  coverUrl: string | null;
  status: string;
  createdById: string;
  approvedById: string | null;
  createdAt: Date;
};

export type MembershipShape = {
  id: string;
  userId: string;
  clubId: string;
  role: string;
  joinedAt: Date;
};

export type JoinRequestShape = {
  id: string;
  userId: string;
  clubId: string;
  message: string | null;
  status: string;
  createdAt: Date;
  decidedAt: Date | null;
};

export type NoticeShape = {
  id: string;
  clubId: string | null;
  authorId: string;
  title: string;
  body: string;
  scope: string;
  pinned: boolean;
  publishAt: Date;
  expireAt: Date | null;
  audienceRole: string | null;
  createdAt: Date;
};

export type PostShape = {
  id: string;
  clubId: string;
  authorId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: Date;
};

export type MediaShape = {
  id: string;
  clubId: string;
  uploaderId: string;
  url: string;
  caption: string | null;
  category: string;
  createdAt: Date;
};
