import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses as coursesTable, reviews as reviewsTable } from '@/db/schema';
import { eq, and, ilike, or, sql, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const faculty = searchParams.get('faculty') || 'all';
  const credits = searchParams.get('credits') || 'all';
  const sort = searchParams.get('sort') || 'code';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '24');
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (search) {
      conditions.push(or(
        ilike(coursesTable.code, `%${search}%`),
        ilike(coursesTable.name_th, `%${search}%`),
        ilike(coursesTable.name_en, `%${search}%`)
      ));
    }

    if (faculty !== 'all') {
      conditions.push(eq(coursesTable.faculty, faculty));
    }

    if (credits !== 'all') {
      // credits stored as string like "3(3-0-6)" — use ilike match
      conditions.push(ilike(coursesTable.credits, `${credits}%`));
    }

    const statsSubquery = db.select({
      course_id: reviewsTable.course_id,
      review_count: sql<number>`count(${reviewsTable.id})::int`.as('review_count'),
      avg_grade_num: sql<number>`AVG(
        CASE 
          WHEN ${reviewsTable.grade} = 'A'  THEN 4.0
          WHEN ${reviewsTable.grade} = 'B+' THEN 3.5
          WHEN ${reviewsTable.grade} = 'B'  THEN 3.0
          WHEN ${reviewsTable.grade} = 'C+' THEN 2.5
          WHEN ${reviewsTable.grade} = 'C'  THEN 2.0
          WHEN ${reviewsTable.grade} = 'D+' THEN 1.5
          WHEN ${reviewsTable.grade} = 'D'  THEN 1.0
          WHEN ${reviewsTable.grade} = 'F'  THEN 0.0
          ELSE NULL
        END
      )::numeric`.as('avg_grade_num')
    })
      .from(reviewsTable)
      .where(eq(reviewsTable.hidden, false))
      .groupBy(reviewsTable.course_id)
      .as('stats');

    // Sort using raw sql to avoid drizzle NULLS LAST issues
    let orderByClause;
    if (sort === 'reviews') {
      orderByClause = sql`COALESCE(${statsSubquery.review_count}, 0) DESC, ${coursesTable.code} ASC`;
    } else if (sort === 'name') {
      orderByClause = sql`${coursesTable.name_en} ASC, ${coursesTable.code} ASC`;
    } else if (sort === 'grade') {
      orderByClause = sql`${statsSubquery.avg_grade_num} DESC NULLS LAST, ${coursesTable.code} ASC`;
    } else {
      orderByClause = sql`${coursesTable.code} ASC`;
    }

    const results = await db.select({
      id: coursesTable.id,
      code: coursesTable.code,
      name_th: coursesTable.name_th,
      name_en: coursesTable.name_en,
      faculty: coursesTable.faculty,
      credits: coursesTable.credits,
      review_count: sql<number>`COALESCE(${statsSubquery.review_count}, 0)`,
      avg_grade: statsSubquery.avg_grade_num,
    })
      .from(coursesTable)
      .leftJoin(statsSubquery, eq(coursesTable.id, statsSubquery.course_id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({
      count: sql<number>`count(*)`
    })
      .from(coursesTable)
      .where(and(...conditions));

    const totalCount = Number(countResult[0]?.count || 0);

    const stats: Record<string, { count: number; avg: string | null }> = {};
    results.forEach(r => {
      stats[r.id] = {
        count: Number(r.review_count),
        avg: r.avg_grade ? Number(r.avg_grade).toFixed(2) : null
      };
    });

    return NextResponse.json({
      courses: results,
      stats,
      hasMore: offset + results.length < totalCount,
      totalCount
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}