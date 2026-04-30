import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { clubsTable } from "./clubs";

export const noticesTable = pgTable("notices", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").references(() => clubsTable.id, {
    onDelete: "cascade",
  }),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  scope: varchar("scope", { length: 32 }).notNull().default("club"),
  pinned: boolean("pinned").notNull().default(false),
  publishAt: timestamp("publish_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expireAt: timestamp("expire_at", { withTimezone: true }),
  audienceRole: varchar("audience_role", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Notice = typeof noticesTable.$inferSelect;
export type InsertNotice = typeof noticesTable.$inferInsert;
