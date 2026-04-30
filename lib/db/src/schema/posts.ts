import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { clubsTable } from "./clubs";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id")
    .notNull()
    .references(() => clubsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Post = typeof postsTable.$inferSelect;
export type InsertPost = typeof postsTable.$inferInsert;
