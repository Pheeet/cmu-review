import { db } from '@/db';
import { courses, reviews } from '@/db/schema';
import { count, eq, ilike, or, sql } from 'drizzle-orm';
import { CoursesClient } from './client';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  faculty?: string;
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
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = 20;

  // Build where conditions
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(courses.code, `%${search}%`),
        ilike(courses.name_th, `%${search}%`)
      )!
    );
  }
  if (faculty && faculty !== 'all') {
    conditions.push(eq(courses.faculty, faculty));
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

  // Main query: courses left join review counts
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
    .orderBy(courses.code)
    .limit(limit)
    .offset((page - 1) * limit);

  // Total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(courses)
    .where(whereClause);

  // All faculties for filter
  const facultyRows = await db
    .selectDistinct({ faculty: courses.faculty })
    .from(courses)
    .where(sql`${courses.faculty} IS NOT NULL`)
    .orderBy(courses.faculty);

  const faculties = facultyRows.map((r) => r.faculty!);

  return (
    <CoursesClient
      courses={rows}
      faculties={faculties}
      total={total}
      page={page}
      limit={limit}
      search={search}
      faculty={faculty}
    />
  );
}
