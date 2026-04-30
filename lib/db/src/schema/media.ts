import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { clubsTable } from "./clubs";

export const mediaTable = pgTable("media", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id")
    .notNull()
    .references(() => clubsTable.id, { onDelete: "cascade" }),
  uploaderId: integer("uploader_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  category: varchar("category", { length: 32 }).notNull().default("gallery"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Media = typeof mediaTable.$inferSelect;
export type InsertMedia = typeof mediaTable.$inferInsert;
