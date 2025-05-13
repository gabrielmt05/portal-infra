import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  is_admin: boolean("is_admin").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
  last_login: timestamp("last_login")
});

// Servers Table
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hostname: text("hostname").notNull(),
  description: text("description"),
  port: integer("port").default(9090).notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(), // Will store encrypted password
  use_ssl: boolean("use_ssl").default(false).notNull(),
  created_by: integer("created_by").notNull().references(() => users.id),
  updated_by: integer("updated_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at"),
  last_accessed: timestamp("last_accessed")
});

// Access Logs Table
export const access_logs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  server_id: integer("server_id").notNull().references(() => servers.id, { onDelete: 'cascade' }),
  user_id: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessed_at: timestamp("accessed_at").defaultNow().notNull(),
  ip_address: text("ip_address"), // To accommodate IPv6 addresses
  user_agent: text("user_agent"),
  success: boolean("success").default(true).notNull()
});

// Create schemas for data insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  full_name: true,
  email: true,
  is_admin: true
});

export const insertServerSchema = createInsertSchema(servers).pick({
  name: true,
  hostname: true,
  description: true,
  port: true,
  username: true,
  password: true,
  use_ssl: true,
  created_by: true
});

export const insertAccessLogSchema = createInsertSchema(access_logs).pick({
  server_id: true,
  user_id: true,
  ip_address: true,
  user_agent: true,
  success: true
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;

export type InsertAccessLog = z.infer<typeof insertAccessLogSchema>;
export type AccessLog = typeof access_logs.$inferSelect;
