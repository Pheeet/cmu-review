import { NextResponse } from 'next/server';
import { db } from '@/db';
import { courses as coursesTable, reviews as reviewsTable } from '@/db/schema';
import { eq, and, ilike, or, sql, desc, asc } from 'drizzle-orm';

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
    // 1. Base conditions
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
      conditions.push(eq(coursesTable.credits, parseInt(credits)));
    }

    // 2. Stats subquery (Count and Avg Grade)
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
    .where(eq(reviewsTable.hidden, false))
    .groupBy(reviewsTable.course_id)
    .as('stats');

    // 3. Main query
    let query = db.select({
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
    .where(and(...conditions));

    // 4. Sorting
    if (sort === 'reviews') {
      query = query.orderBy(desc(sql`review_count`), asc(coursesTable.code));
    } else if (sort === 'name') {
      query = query.orderBy(asc(coursesTable.name_en), asc(coursesTable.code));
    } else if (sort === 'grade') {
      query = query.orderBy(desc(sql`avg_grade`), asc(coursesTable.code));
    } else {
      query = query.orderBy(asc(coursesTable.code));
    }

    // 5. Execute with pagination
    const results = await query.limit(limit).offset(offset);

    // 6. Get total count for filters (without limit/offset)
    const countResult = await db.select({ 
      count: sql<number>`count(*)` 
    })
    .from(coursesTable)
    .where(and(...conditions));
    
    const totalCount = Number(countResult[0]?.count || 0);

    // 7. Format response to match expected frontend structure
    const stats: Record<string, { count: number; avg: string | null }> = {};
    results.forEach(r => {
      stats[r.id] = {
        count: Number(r.review_count),
        avg: r.avg_grade
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
