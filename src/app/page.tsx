export const dynamic = 'force-dynamic';

import { MainPage } from '@/components/MainPage';
import { db } from '@/db';
import { courses as coursesTable, reviews as reviewsTable } from '@/db/schema';
import { eq, sql, asc } from 'drizzle-orm';

export const revalidate = 60; // Revalidate cache every 60 seconds

export default async function Home() {
  // Stats subquery
  const statsSubquery = db.select({
    course_id: reviewsTable.course_id,
    review_count: sql<number>`count(${reviewsTable.id})`.as('review_count'),
    avg_grade: sql<string>`ROUND(AVG(
      CASE 
        WHEN ${reviewsTable.grade} = 'A' THEN 4.0
        WHEN ${reviewsTable.grade} = 'B+' THEN 3.5
        WHEN ${reviewsTable.grade} = 'B' THEN 3.0
        WHEN ${reviewsTable.grade} = 'C+' THEN 2.5
        WHEN ${reviewsTable.grade} = 'C' THEN 2.0
        WHEN ${reviewsTable.grade} = 'D+' THEN 1.5
        WHEN ${reviewsTable.grade} = 'D' THEN 1.0
        WHEN ${reviewsTable.grade} = 'F' THEN 0.0
        ELSE NULL
      END
    )::numeric, 2)::text`.as('avg_grade')
  })
  .from(reviewsTable)
  .groupBy(reviewsTable.course_id)
  .as('stats');

  const results = await db.select({
    id: coursesTable.id,
    code: coursesTable.code,
    name_th: coursesTable.name_th,
    name_en: coursesTable.name_en,
    faculty: coursesTable.faculty,
    credits: coursesTable.credits,
    review_count: sql<number>`COALESCE(${statsSubquery.review_count}, 0)`,
    avg_grade: statsSubquery.avg_grade,
  })
  .from(coursesTable)
  .leftJoin(statsSubquery, eq(coursesTable.id, statsSubquery.course_id))
  .orderBy(asc(coursesTable.code))
  .limit(24);

  // Fetch unique faculties and credits for filter
  const allFacultiesRaw = await db.selectDistinct({ faculty: coursesTable.faculty }).from(coursesTable);
  const faculties = allFacultiesRaw.map(f => f.faculty).filter((f): f is string => !!f).sort();
  
  const allCreditsRaw = await db.selectDistinct({ credits: coursesTable.credits }).from(coursesTable);
  const creditOptions = allCreditsRaw.map(c => c.credits).filter((c): c is number => c !== null).sort((a, b) => a - b);

  const totalCountResult = await db.select({ count: sql<number>`count(*)` }).from(coursesTable);
  const totalCount = Number(totalCountResult[0]?.count || 0);

  const stats: Record<string, { count: number; avg: string | null }> = {};
  results.forEach(r => {
    stats[r.id] = {
      count: Number(r.review_count),
      avg: r.avg_grade
    };
  });

  return (
    <MainPage 
      initialCourses={results as any} 
      initialStats={stats} 
      initialTotalCount={totalCount}
      faculties={faculties}
      creditOptions={creditOptions}
    />
  );
}
