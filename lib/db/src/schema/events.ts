import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { clubsTable } from "./clubs";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id")
    .notNull()
    .references(() => clubsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  venue: text("venue").notNull(),
  capacity: integer("capacity"),
  coverUrl: text("cover_url"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  approvedById: integer("approved_by_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Event = typeof eventsTable.$inferSelect;
export type InsertEvent = typeof eventsTable.$inferInsert;

export const eventRsvpsTable = pgTable(
  "event_rsvps",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => eventsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    eventUserUnique: uniqueIndex("event_rsvps_event_user_unique").on(
      table.eventId,
      table.userId,
    ),
  }),
);

export type EventRsvp = typeof eventRsvpsTable.$inferSelect;
export type InsertEventRsvp = typeof eventRsvpsTable.$inferInsert;
