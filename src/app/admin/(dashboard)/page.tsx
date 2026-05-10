import { db } from '@/db';
import { courses, reviews } from '@/db/schema';
import { count, gt, desc, sql, eq } from 'drizzle-orm';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [courseCount] = await db.select({ count: count() }).from(courses);
  const [reviewCount] = await db.select({ count: count() }).from(reviews);
  const [reportedCount] = await db.select({ count: count() }).from(reviews).where(gt(reviews.report_count, 0));
  return {
    courses: courseCount.count,
    reviews: reviewCount.count,
    reported: reportedCount.count,
  };
}

async function getRecentReviews() {
  return db
    .select({
      id: reviews.id,
      course_code: courses.code,
      course_name: sql<string>`COALESCE(${courses.name_en}, ${courses.name_th})`,
      reviewer_name: reviews.reviewer_name,
      grade: reviews.grade,
      created_at: reviews.created_at,
    })
    .from(reviews)
    .leftJoin(courses, eq(reviews.course_id, courses.id))
    .orderBy(desc(reviews.created_at))
    .limit(10);
}

async function getTopReported() {
  return db
    .select({
      id: reviews.id,
      course_code: courses.code,
      course_name: sql<string>`COALESCE(${courses.name_en}, ${courses.name_th})`,
      reviewer_name: reviews.reviewer_name,
      comment: reviews.comment,
      report_count: reviews.report_count,
    })
    .from(reviews)
    .leftJoin(courses, eq(reviews.course_id, courses.id))
    .where(gt(reviews.report_count, 0))
    .orderBy(desc(reviews.report_count))
    .limit(5);
}

export default async function AdminDashboard() {
  const [stats, recentReviews, topReported] = await Promise.all([
    getStats(),
    getRecentReviews(),
    getTopReported(),
  ]);

  return (
    <DashboardClient
      stats={stats}
      recentReviews={recentReviews.map((r) => ({
        ...r,
        created_at: r.created_at?.toISOString() ?? null,
      }))}
      topReported={topReported}
    />
  );
}
