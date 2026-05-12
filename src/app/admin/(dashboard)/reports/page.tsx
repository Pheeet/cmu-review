import { db } from '@/db';
import { reviews, courses } from '@/db/schema';
import { eq, gt, desc, sql } from 'drizzle-orm';
import { ReportsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const reported = await db
    .select({
      id: reviews.id,
      course_code: courses.code,
      course_name: sql<string>`COALESCE(${courses.name_en}, ${courses.name_th})`,
      reviewer_name: reviews.reviewer_name,
      grade: reviews.grade,
      academic_year: reviews.academic_year,
      semester: reviews.semester,
      comment: reviews.comment,
      report_count: reviews.report_count,
      like_count: reviews.like_count,
      created_at: reviews.created_at,
    })
    .from(reviews)
    .leftJoin(courses, eq(reviews.course_id, courses.id))
    .where(gt(reviews.report_count, 0))
    .orderBy(desc(reviews.report_count), desc(reviews.created_at));

  return (
    <ReportsClient
      reviews={reported.map((r) => ({ ...r, created_at: r.created_at?.toISOString() ?? null }))}
    />
  );
}
