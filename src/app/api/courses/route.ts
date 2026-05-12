import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses as coursesTable, reviews as reviewsTable } from '@/db/schema';
import { eq, and, ilike, or, sql, asc } from 'drizzle-orm';
import { escapeLike } from '@/lib/escape-like';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const faculty = searchParams.get('faculty') || 'all';
  const credits = searchParams.get('credits') || 'all';
  const sort = searchParams.get('sort') || 'code';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (search) {
      const safe = escapeLike(search);
      conditions.push(or(
        ilike(coursesTable.code, `%${safe}%`),
        ilike(coursesTable.name_th, `%${safe}%`),
        ilike(coursesTable.name_en, `%${safe}%`)
      ));
    }

    if (faculty !== 'all') {
      conditions.push(eq(coursesTable.faculty, faculty));
    }

    if (credits !== 'all') {
      conditions.push(eq(coursesTable.credits, parseInt(credits)));
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
      )::numeric`.as('avg_grade_num'),
      mode_grade: sql<string>`
        (SELECT r2.grade FROM reviews r2
         WHERE r2.course_id = "reviews"."course_id"
           AND r2.grade IS NOT NULL
           AND r2.grade != 'ไม่ระบุ'
         GROUP BY r2.grade ORDER BY count(*) DESC LIMIT 1)
      `.as('mode_grade'),
      avg_rating: sql<number>`AVG(${reviewsTable.rating})::numeric`.as('avg_rating'),
      rating_count: sql<number>`count(${reviewsTable.rating}) FILTER (WHERE ${reviewsTable.rating} IS NOT NULL)::int`.as('rating_count'),
    })
      .from(reviewsTable)
      .groupBy(reviewsTable.course_id)
      .as('stats');

    // Sort using raw sql to avoid drizzle NULLS LAST issues
    let orderByClause;
    if (sort === 'reviews') {
      orderByClause = sql`COALESCE(${statsSubquery.review_count}, 0) DESC, ${coursesTable.code} ASC`;
    } else if (sort === 'name') {
      orderByClause = sql`${coursesTable.name_en} ASC, ${coursesTable.code} ASC`;
    } else if (sort === 'grade') {
      orderByClause = sql`
        CASE ${statsSubquery.mode_grade}
          WHEN 'A' THEN 10
          WHEN 'B+' THEN 9
          WHEN 'B' THEN 8
          WHEN 'C+' THEN 7
          WHEN 'C' THEN 6
          WHEN 'D+' THEN 5
          WHEN 'D' THEN 4
          WHEN 'S' THEN 3
          WHEN 'W' THEN 2
          WHEN 'F' THEN 1
          ELSE 0
        END DESC NULLS LAST, ${coursesTable.code} ASC
      `;
    } else if (sort === 'rating') {
      orderByClause = sql`${statsSubquery.avg_rating} DESC NULLS LAST, ${coursesTable.code} ASC`;
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
      mode_grade: statsSubquery.mode_grade,
      avg_rating: statsSubquery.avg_rating,
      rating_count: statsSubquery.rating_count,
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

    const stats: Record<string, { count: number; avg: string | null; modeGrade: string | null; avgRating: number | null; ratingCount: number }> = {};
    results.forEach(r => {
      stats[r.id] = {
        count: Number(r.review_count),
        avg: r.avg_grade ? Number(r.avg_grade).toFixed(2) : null,
        modeGrade: r.mode_grade || null,
        avgRating: r.avg_rating ? Number(Number(r.avg_rating).toFixed(1)) : null,
        ratingCount: Number(r.rating_count) || 0,
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