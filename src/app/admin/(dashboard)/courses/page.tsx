import { db } from '@/db';
import { courses, reviews } from '@/db/schema';
import { count, eq, ilike, or, sql, desc, asc } from 'drizzle-orm';
import { escapeLike } from '@/lib/escape-like';
import { CoursesClient } from './client';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  faculty?: string;
  credits?: string;
  sort?: string;
  page?: string;
}

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const faculty = params.faculty || 'all';
  const credits = params.credits || 'all';
  const sort = params.sort || 'code';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = 15;

  // Build where conditions
  const conditions = [];
  if (search) {
    const safe = escapeLike(search);
    conditions.push(
      or(
        ilike(courses.code, `%${safe}%`),
        ilike(courses.name_th, `%${safe}%`)
      )!
    );
  }
  if (faculty && faculty !== 'all') {
    conditions.push(eq(courses.faculty, faculty));
  }
  if (credits && credits !== 'all') {
    conditions.push(eq(courses.credits, parseInt(credits)));
  }
  const whereClause = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;

  // Subquery: review count per course
  const reviewCounts = db
    .select({
      course_id: reviews.course_id,
      review_count: count(reviews.id).as('review_count'),
    })
    .from(reviews)
    .groupBy(reviews.course_id)
    .as('rc');

  // Build order by
  const orderByClause = (() => {
    switch (sort) {
      case 'reviews':
        return desc(sql`COALESCE(${reviewCounts.review_count}, 0)`);
      case 'name':
        return asc(courses.name_th);
      default:
        return asc(courses.code);
    }
  })();

  // Main query
  const rows = await db
    .select({
      id: courses.id,
      code: courses.code,
      name_th: courses.name_th,
      name_en: courses.name_en,
      faculty: courses.faculty,
      credits: courses.credits,
      description: courses.description,
      review_count: sql<number>`COALESCE(${reviewCounts.review_count}, 0)`,
    })
    .from(courses)
    .leftJoin(reviewCounts, eq(courses.id, reviewCounts.course_id))
    .where(whereClause)
    .orderBy(orderByClause, asc(courses.code))
    .limit(limit)
    .offset((page - 1) * limit);

  // Total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(courses)
    .where(whereClause);

  // Faculties
  const facultyRows = await db
    .selectDistinct({ faculty: courses.faculty })
    .from(courses)
    .where(sql`${courses.faculty} IS NOT NULL`)
    .orderBy(courses.faculty);

  // Credit options
  const creditRows = await db
    .selectDistinct({ credits: courses.credits })
    .from(courses)
    .where(sql`${courses.credits} IS NOT NULL`)
    .orderBy(courses.credits);

  return (
    <CoursesClient
      courses={rows}
      faculties={facultyRows.map((r) => r.faculty!)}
      creditOptions={creditRows.map((r) => r.credits!)}
      total={total}
      page={page}
      limit={limit}
      search={search}
      faculty={faculty}
      credits={credits}
      sort={sort}
    />
  );
}
