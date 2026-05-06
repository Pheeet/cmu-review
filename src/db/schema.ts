import { pgTable, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  hidden: boolean('hidden').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type Course = typeof courses.$inferSelect;
export type Review = typeof reviews.$inferSelect;
