import { pgTable, serial, text, integer, jsonb, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Languages table
export const languages = pgTable('languages', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(), // e.g., 'it', 'es', 'fr'
  name: text('name').notNull(), // e.g., 'Italian', 'Spanish', 'French'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Skill levels table
export const skillLevels = pgTable('skill_levels', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., 'beginner', 'intermediate', 'advanced'
  name: text('name').notNull(), // e.g., 'Beginner', 'Intermediate', 'Advanced'
  description: text('description'),
  sortOrder: integer('sort_order').default(0), // For ordering levels
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Courses table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  languageId: integer('language_id').notNull().references(() => languages.id),
  skillLevelId: integer('skill_level_id').notNull().references(() => skillLevels.id),
  courseNumber: integer('course_number').notNull(), // e.g., 1, 2, 3, etc.
  title: text('title').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lessons table
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonNumber: integer('lesson_number').notNull(), // e.g., 1, 2, 3, etc.
  title: text('title').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lesson steps table - stores the 3 steps for each lesson
export const lessonSteps = pgTable('lesson_steps', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(), // 1, 2, or 3
  stepType: varchar('step_type', { length: 20 }).notNull(), // 'introduction', 'typing', 'comprehension'
  content: jsonb('content').notNull(), // Flexible JSON to store step-specific content
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const languagesRelations = relations(languages, ({ many }) => ({
  courses: many(courses),
}));

export const skillLevelsRelations = relations(skillLevels, ({ many }) => ({
  courses: many(courses),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  language: one(languages, {
    fields: [courses.languageId],
    references: [languages.id],
  }),
  skillLevel: one(skillLevels, {
    fields: [courses.skillLevelId],
    references: [skillLevels.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  steps: many(lessonSteps),
}));

export const lessonStepsRelations = relations(lessonSteps, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonSteps.lessonId],
    references: [lessons.id],
  }),
}));

// Define content schemas for different step types
export const mcqSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
});

export const step1ContentSchema = z.object({
  italian: z.string(),
  english: z.string(),
  audio: z.string(),
  note: z.string(),
  mcq: mcqSchema,
});

export const step2ContentSchema = z.object({
  type_prompt: z.string(),
  expected_answer: z.string(),
  alt_answers: z.array(z.string()),
});

export const step3ContentSchema = z.object({
  audio_sentence: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
});

// Insert schemas
export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
  createdAt: true,
});

export const insertSkillLevelSchema = createInsertSchema(skillLevels).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLessonStepSchema = createInsertSchema(lessonSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;

export type SkillLevel = typeof skillLevels.$inferSelect;
export type InsertSkillLevel = z.infer<typeof insertSkillLevelSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type LessonStep = typeof lessonSteps.$inferSelect;
export type InsertLessonStep = z.infer<typeof insertLessonStepSchema>;

// User management tables (existing)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  password: text('password'), // For local auth users
  authProvider: text('auth_provider').default('local').notNull(), // 'local', 'github', 'google', etc.
  selectedLanguage: text('selected_language'), // User's chosen language to learn
  selectedLevel: text('selected_level'), // User's chosen skill level
  completedOnboarding: boolean('completed_onboarding').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').default('en').notNull(),
  theme: text('theme').default('light').notNull(),
  soundEnabled: boolean('sound_enabled').default(true).notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  difficultyLevel: text('difficulty_level').default('beginner').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userProgress = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  courseId: text('course_id').notNull(),
  lessonId: text('lesson_id').notNull(),
  stepNumber: integer('step_number').notNull(),
  completed: boolean('completed').default(false).notNull(),
  score: integer('score'),
  timeSpent: integer('time_spent'), // in seconds
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userStats = pgTable('user_stats', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').notNull(),
  streak: integer('streak').default(0).notNull(),
  wordsLearned: integer('words_learned').default(0).notNull(),
  lessonsCompleted: integer('lessons_completed').default(0).notNull(),
  totalTimeSpent: integer('total_time_spent').default(0).notNull(), // in seconds
  lastLessonDate: timestamp('last_lesson_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  source: text('source'), // where they came from
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: jsonb('sess').notNull(),
  expire: timestamp('expire', { mode: 'date' }).notNull(),
});

// User table relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings),
  progress: many(userProgress),
  stats: many(userStats),
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

// User insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = insertUserSchema.partial().required({ id: true });

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
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

// User types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;

// Extended types with relations
export type CourseWithRelations = Course & {
  language: Language;
  skillLevel: SkillLevel;
  lessons: LessonWithSteps[];
};

export type LessonWithSteps = Lesson & {
  steps: LessonStep[];
};

export type Step1Content = z.infer<typeof step1ContentSchema>;
export type Step2Content = z.infer<typeof step2ContentSchema>;
export type Step3Content = z.infer<typeof step3ContentSchema>;