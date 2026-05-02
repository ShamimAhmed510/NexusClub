export type ClubBundle = {
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
  memberCount: number;
  eventCount: number;
};

export function serializeClub(c: ClubBundle) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    category: c.category,
    shortDescription: c.shortDescription,
    description: c.description,
    logoUrl: c.logoUrl,
    coverUrl: c.coverUrl,
    accentColor: c.accentColor,
    websiteUrl: c.websiteUrl,
    facebookUrl: c.facebookUrl,
    instagramUrl: c.instagramUrl,
    memberCount: c.memberCount,
    eventCount: c.eventCount,
  };
}

export type EventBundle = {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date | null;
  venue: string;
  capacity: number | null;
  coverUrl: string | null;
  status: string;
  rsvpCount: number;
  viewerHasRsvp: boolean;
};

export function serializeEvent(e: EventBundle) {
  return {
    id: e.id,
    clubId: e.clubId,
    clubSlug: e.clubSlug,
    clubName: e.clubName,
    title: e.title,
    description: e.description,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    venue: e.venue,
    capacity: e.capacity,
    coverUrl: e.coverUrl,
    status: e.status,
    rsvpCount: e.rsvpCount,
    viewerHasRsvp: e.viewerHasRsvp,
  };
}

export type PostBundle = {
  id: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  title: string;
  body: string;
  imageUrl: string | null;
  authorName: string;
  createdAt: Date;
};

export function serializePost(p: PostBundle) {
  return {
    id: p.id,
    clubId: p.clubId,
    clubSlug: p.clubSlug,
    clubName: p.clubName,
    title: p.title,
    body: p.body,
    imageUrl: p.imageUrl,
    authorName: p.authorName,
    createdAt: p.createdAt.toISOString(),
  };
}

export type NoticeBundle = {
  id: string;
  clubId?: string | null;
  clubSlug?: string | null;
  clubName?: string | null;
  authorId: string;
  title: string;
  body: string;
  scope: string;
  status?: string;
  pinned: boolean;
  publishAt: Date;
  expireAt: Date | null;
  audienceRole: string | null;
  createdAt: Date;
};

export function serializeNotice(n: NoticeBundle) {
  return {
    id: n.id,
    clubId: n.clubId ?? null,
    clubSlug: n.clubSlug ?? null,
    clubName: n.clubName ?? null,
    title: n.title,
    body: n.body,
    scope: n.scope,
    status: n.status ?? "approved",
    pinned: n.pinned,
    publishAt: n.publishAt.toISOString(),
    expireAt: n.expireAt ? n.expireAt.toISOString() : null,
    audienceRole: n.audienceRole,
    createdAt: n.createdAt.toISOString(),
  };
}

export type MediaBundle = {
  id: string;
  clubId: string;
  clubSlug: string;
  url: string;
  caption: string | null;
  category: string;
  createdAt: Date;
};

export function serializeMedia(m: MediaBundle) {
  return {
    id: m.id,
    clubId: m.clubId,
    clubSlug: m.clubSlug,
    url: m.url,
    caption: m.caption,
    category: m.category,
    createdAt: m.createdAt.toISOString(),
  };
}

export type MemberBundle = {
  id: string;
  userId: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: Date;
};

export function serializeMember(m: MemberBundle) {
  return {
    id: m.id,
    userId: m.userId,
    clubId: m.clubId,
    clubSlug: m.clubSlug,
    clubName: m.clubName,
    fullName: m.fullName,
    email: m.email,
    avatarUrl: m.avatarUrl,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  };
}

export type JoinRequestBundle = {
  id: string;
  userId: string;
  clubId: string;
  clubSlug: string;
  clubName: string;
  fullName: string;
  email: string;
  studentId?: string | null;
  department?: string | null;
  batch?: string | null;
  message?: string | null;
  status: string;
  createdAt: Date;
};

export function serializeJoinRequest(r: JoinRequestBundle) {
  return {
    id: r.id,
    userId: r.userId,
    clubId: r.clubId,
    clubSlug: r.clubSlug,
    clubName: r.clubName,
    fullName: r.fullName,
    email: r.email,
    studentId: r.studentId ?? null,
    department: r.department ?? null,
    batch: r.batch ?? null,
    message: r.message ?? null,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

export type UserPublicBundle = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  studentId: string | null;
  department: string | null;
  batch: string | null;
  avatarUrl: string | null;
  createdAt: Date;
};

export function serializeUserPublic(u: UserPublicBundle) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    studentId: u.studentId,
    department: u.department,
    batch: u.batch,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt.toISOString(),
  };
}
