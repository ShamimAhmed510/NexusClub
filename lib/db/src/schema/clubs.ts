import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const clubsTable = pgTable("clubs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: text("name").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  shortDescription: text("short_description").notNull(),
  description: text("description").notNull(),
  logoUrl: text("logo_url"),
  coverUrl: text("cover_url"),
  accentColor: varchar("accent_color", { length: 16 }).notNull().default("#1f4e79"),
  websiteUrl: text("website_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
});

export type Club = typeof clubsTable.$inferSelect;
export type InsertClub = typeof clubsTable.$inferInsert;
