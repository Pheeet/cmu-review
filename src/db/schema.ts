import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name_th: text('name_th'),
  name_en: text('name_en'),
  faculty: text('faculty'),
  credits: integer('credits'),
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  course_id: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
  academic_year: text('academic_year'),
  semester: text('semester'),
  section_type: text('section_type'),
  grade: text('grade'),
  comment: text('comment').notNull(),
  reviewer_name: text('reviewer_name'),
  fingerprint_id: text('fingerprint_id'),
  report_count: integer('report_count').default(0),
  like_count: integer('like_count').default(0),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const rate_limit_logs = pgTable('rate_limit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  ip: text('ip').notNull(),
  action: text('action').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const review_likes = pgTable('review_likes', {
  review_id: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  ip: text('ip'),
  fingerprint_id: text('fingerprint_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const review_reports = pgTable('review_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  review_id: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  ip: text('ip'),
  fingerprint_id: text('fingerprint_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Course = typeof courses.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type RateLimitLog = typeof rate_limit_logs.$inferSelect;
export type ReviewLike = typeof review_likes.$inferSelect;
export type ReviewReport = typeof review_reports.$inferSelect;
