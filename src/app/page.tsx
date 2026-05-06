export const dynamic = 'force-dynamic';

import { MainPage } from '@/components/MainPage';
import { db } from '@/db';
import { courses as coursesTable, reviews as reviewsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { averageGradeLabel } from '@/lib/cmu';

export const revalidate = 60; // Revalidate cache every 60 seconds

export default async function Home() {
  const allCourses = await db.select().from(coursesTable).orderBy(coursesTable.code);
  const allReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.hidden, false));

  const stats: Record<string, { count: number; avg: string | null }> = {};
  const byCourse: Record<string, string[]> = {};

  allReviews.forEach(r => {
    if (!r.course_id) return;
    stats[r.course_id] ||= { count: 0, avg: null };
    stats[r.course_id].count++;
    
    byCourse[r.course_id] ||= [];
    if (r.grade) byCourse[r.course_id].push(r.grade);
  });

  Object.keys(byCourse).forEach(cid => {
    stats[cid].avg = averageGradeLabel(byCourse[cid]);
  });

  return <MainPage initialCourses={allCourses} initialStats={stats} />;
}
