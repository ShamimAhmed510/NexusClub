import type {
  Club,
  Event,
  Post,
  Notice,
  Media,
  JoinRequest,
  Membership,
  User,
} from "@workspace/db";

export type ClubBundle = Club & {
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

export function serializeEvent(
  e: Event & {
    clubSlug: string;
    clubName: string;
    rsvpCount: number;
    viewerHasRsvp: boolean;
  },
) {
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

export function serializePost(
  p: Post & {
    clubSlug: string;
    clubName: string;
    authorName: string;
  },
) {
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

export function serializeNotice(
  n: Notice & {
    clubSlug?: string | null;
    clubName?: string | null;
  },
) {
  return {
    id: n.id,
    clubId: n.clubId,
    clubSlug: n.clubSlug ?? null,
    clubName: n.clubName ?? null,
    title: n.title,
    body: n.body,
    scope: n.scope,
    pinned: n.pinned,
    publishAt: n.publishAt.toISOString(),
    expireAt: n.expireAt ? n.expireAt.toISOString() : null,
    audienceRole: n.audienceRole,
    createdAt: n.createdAt.toISOString(),
  };
}

export function serializeMedia(
  m: Media & { clubSlug: string },
) {
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

export function serializeMember(
  mem: Membership & {
    fullName: string;
    email: string;
    avatarUrl: string | null;
    clubSlug: string;
    clubName: string;
  },
) {
  return {
    id: mem.id,
    userId: mem.userId,
    clubId: mem.clubId,
    clubSlug: mem.clubSlug,
    clubName: mem.clubName,
    fullName: mem.fullName,
    email: mem.email,
    avatarUrl: mem.avatarUrl,
    role: mem.role,
    joinedAt: mem.joinedAt.toISOString(),
  };
}

export function serializeJoinRequest(
  r: JoinRequest & {
    clubSlug: string;
    clubName: string;
    fullName: string;
    email: string;
  },
) {
  return {
    id: r.id,
    userId: r.userId,
    clubId: r.clubId,
    clubSlug: r.clubSlug,
    clubName: r.clubName,
    fullName: r.fullName,
    email: r.email,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  };
}

export function serializeUserPublic(u: User) {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    studentId: u.studentId,
    department: u.department,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt.toISOString(),
  };
}
