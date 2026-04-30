import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { clubsTable } from "./clubs";

export const membershipsTable = pgTable(
  "memberships",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    clubId: integer("club_id")
      .notNull()
      .references(() => clubsTable.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 32 }).notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userClubUnique: uniqueIndex("memberships_user_club_unique").on(
      table.userId,
      table.clubId,
    ),
  }),
);

export type Membership = typeof membershipsTable.$inferSelect;
export type InsertMembership = typeof membershipsTable.$inferInsert;

export const joinRequestsTable = pgTable("join_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clubId: integer("club_id")
    .notNull()
    .references(() => clubsTable.id, { onDelete: "cascade" }),
  message: varchar("message", { length: 500 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export type JoinRequest = typeof joinRequestsTable.$inferSelect;
export type InsertJoinRequest = typeof joinRequestsTable.$inferInsert;
