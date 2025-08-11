import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  password: varchar("password"), // For local email/password authentication
  authProvider: varchar("auth_provider").notNull().default("replit"), // 'replit' or 'local'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  selectedLanguage: varchar("selected_language").notNull().default("spanish"),
  notificationFrequency: integer("notification_frequency").notNull().default(30), // minutes
  notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  language: varchar("language").notNull(),
  courseId: varchar("course_id").notNull(),
  lessonId: varchar("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  score: integer("score").default(0), // percentage
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User stats table
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  language: varchar("language").notNull(),
  streak: integer("streak").notNull().default(0),
  totalLessons: integer("total_lessons").notNull().default(0),
  wordsLearned: integer("words_learned").notNull().default(0),
  lastLessonDate: timestamp("last_lesson_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Waitlist table for intermediate/advanced level signups
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull(),
  language: varchar("language").notNull(),
  level: varchar("level").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  progress: many(userProgress),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
});

// Course and lesson types
export interface CourseItem {
  italian: string;
  english: string;
  note: string;
}

export interface CourseLesson {
  title: string;
  items: CourseItem[];
}

export interface Course {
  title: string;
  description: string;
  lessons: Record<string, CourseLesson>;
}

export interface LessonContent {
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
  note?: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correct: number;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  content: LessonContent;
  quiz: LessonQuiz;
  words: string[];
}

export interface DashboardData {
  settings: UserSettings;
  stats: UserStats;
  progress: UserProgress[];
  latestProgress?: UserProgress;
}

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
