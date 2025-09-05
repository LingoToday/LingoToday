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

// Lesson steps table - stores the 4 steps for each lesson
export const lessonSteps = pgTable('lesson_steps', {
  id: serial('id').primaryKey(),
  lessonId: integer('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  stepNumber: integer('step_number').notNull(), // 1, 2, 3, or 4
  stepType: varchar('step_type', { length: 20 }).notNull(), // 'word_review', 'quick_check', 'typing', 'comprehension'
  content: jsonb('content').notNull(), // Flexible JSON to store step-specific content
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Checkpoint reviews table - appears after every 4 lessons
export const checkpoints = pgTable('checkpoints', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  checkpointNumber: integer('checkpoint_number').notNull(), // 1, 2, 3, etc. (after lessons 4, 8, 12, etc.)
  title: text('title').notNull(),
  description: text('description'),
  questions: jsonb('questions').notNull(), // Array of checkpoint questions
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Checkpoint progress table - tracks user's checkpoint completion
export const checkpointProgress = pgTable('checkpoint_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  checkpointId: integer('checkpoint_id').notNull().references(() => checkpoints.id, { onDelete: 'cascade' }),
  completed: boolean('completed').default(false).notNull(),
  score: integer('score'), // Out of total questions
  answers: jsonb('answers'), // User's answers to checkpoint questions
  timeSpent: integer('time_spent'), // in seconds
  completedAt: timestamp('completed_at'),
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
  checkpoints: many(checkpoints),
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

export const checkpointsRelations = relations(checkpoints, ({ one, many }) => ({
  course: one(courses, {
    fields: [checkpoints.courseId],
    references: [courses.id],
  }),
  progress: many(checkpointProgress),
}));

export const checkpointProgressRelations = relations(checkpointProgress, ({ one }) => ({
  user: one(users, {
    fields: [checkpointProgress.userId],
    references: [users.id],
  }),
  checkpoint: one(checkpoints, {
    fields: [checkpointProgress.checkpointId],
    references: [checkpoints.id],
  }),
}));

// Define content schemas for different step types
export const mcqSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  answer: z.string(),
});

// Checkpoint question schema
export const checkpointQuestionSchema = z.object({
  id: z.number(),
  question: z.string(),
  audioUrl: z.string().optional(), // Optional audio for listening questions
  options: z.array(z.string()), // 4 multiple choice options
  correctAnswer: z.string(),
  explanation: z.string().optional(),
});

// Checkpoint questions array schema
export const checkpointQuestionsSchema = z.array(checkpointQuestionSchema);

// Step 1: Word/Phrase Review (just the review content)
export const step1ContentSchema = z.object({
  italian: z.string(),
  english: z.string(),
  audio: z.string(),
  note: z.string(),
});

// Step 2: Quick Check Multiple Choice
export const step2ContentSchema = z.object({
  mcq: mcqSchema,
});

// Step 3: Typing Practice
export const step3ContentSchema = z.object({
  type_prompt: z.string(),
  expected_answer: z.string(),
  alt_answers: z.array(z.string()),
});

// Step 4: Listening Comprehension
export const step4ContentSchema = z.object({
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

export const insertCheckpointSchema = createInsertSchema(checkpoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCheckpointProgressSchema = createInsertSchema(checkpointProgress).omit({
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

export type Checkpoint = typeof checkpoints.$inferSelect;
export type InsertCheckpoint = z.infer<typeof insertCheckpointSchema>;

export type CheckpointProgress = typeof checkpointProgress.$inferSelect;
export type InsertCheckpointProgress = z.infer<typeof insertCheckpointProgressSchema>;

export type CheckpointQuestion = z.infer<typeof checkpointQuestionSchema>;

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
  currentCourse: text('current_course').default('course1'), // Current course user is on (e.g., 'course1', 'course2')
  currentLesson: text('current_lesson').default('lesson1'), // Current lesson user is on (e.g., 'lesson1', 'lesson2')
  priceTier: text('price_tier').default('n/a').notNull(), // Price tier: 'pro-monthly', 'pro-yearly', 'plus-monthly', 'plus-yearly', 'free-trial', or 'n/a'
  completedOnboarding: boolean('completed_onboarding').default(false).notNull(),
  hasSeenNotificationSetup: boolean('has_seen_notification_setup').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userSettings = pgTable('user_settings', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  language: text('language').default('en').notNull(),
  theme: text('theme').default('light').notNull(),
  soundEnabled: boolean('sound_enabled').default(true).notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  notificationFrequency: integer('notification_frequency').default(15).notNull(), // in minutes
  notificationStartTime: text('notification_start_time').default('09:00').notNull(), // 24-hour format HH:MM
  notificationEndTime: text('notification_end_time').default('18:00').notNull(), // 24-hour format HH:MM
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

// Page views analytics table
export const pageViews = pgTable('page_views', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // Allow anonymous tracking
  page: text('page').notNull(), // e.g., '/dashboard', '/lesson/italian/course1/lesson1'
  userAgent: text('user_agent'), // Browser information
  ipAddress: text('ip_address'), // For duplicate prevention (hashed for privacy)
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
});

// Page views relations
export const pageViewsRelations = relations(pageViews, ({ one }) => ({
  user: one(users, {
    fields: [pageViews.userId],
    references: [users.id],
  }),
}));

// User table relations
export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings),
  progress: many(userProgress),
  stats: many(userStats),
  pageViews: many(pageViews),
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

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  viewedAt: true,
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

export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;

// Extended types with relations
export type CourseWithRelations = Course & {
  language: Language;
  skillLevel: SkillLevel;
  lessons: LessonWithSteps[];
  checkpoints: Checkpoint[];
};

export type LessonWithSteps = Lesson & {
  steps: LessonStep[];
};

export type Step1Content = z.infer<typeof step1ContentSchema>;
export type Step2Content = z.infer<typeof step2ContentSchema>;
export type Step3Content = z.infer<typeof step3ContentSchema>;