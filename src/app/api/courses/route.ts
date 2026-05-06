import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses as coursesTable, reviews as reviewsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { averageGradeLabel } from '@/lib/cmu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allCourses = await db.select().from(coursesTable).orderBy(coursesTable.code);
    // Limit reviews to prevent memory issues (basic protection)
    const allReviews = await db.select().from(reviewsTable)
      .where(eq(reviewsTable.hidden, false))
      .limit(1000);

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

    return NextResponse.json({ courses: allCourses, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
