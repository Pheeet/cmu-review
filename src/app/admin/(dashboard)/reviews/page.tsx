import { db } from '@/db';
import { reviews, courses } from '@/db/schema';
import { count, eq, desc, sql, ilike, or } from 'drizzle-orm';
import { ReviewsClient } from './client';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  faculty?: string;
  grade?: string;
  sort?: string;
  page?: string;
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.search || '';
  const faculty = params.faculty || 'all';
  const grade = params.grade || 'all';
  const sort = params.sort || 'recent';
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const limit = 15;

  const conditions = [];
  if (grade !== 'all') conditions.push(eq(reviews.grade, grade));
  if (faculty !== 'all') conditions.push(eq(courses.faculty, faculty));
  const whereSql = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;

  const orderBy =
    sort === 'likes' ? [desc(reviews.like_count)] :
    sort === 'reports' ? [desc(reviews.report_count)] :
    [desc(reviews.created_at)];

  const rows = await db
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
    .where(whereSql)
    .orderBy(...orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const filtered = search
    ? rows.filter(
        (r) =>
          r.comment?.toLowerCase().includes(search.toLowerCase()) ||
          r.course_code?.toLowerCase().includes(search.toLowerCase()) ||
          r.course_name?.toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  const [{ total }] = await db
    .select({ total: count() })
    .from(reviews)
    .where(conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined);

  const facultyRows = await db
    .selectDistinct({ faculty: courses.faculty })
    .from(courses)
    .where(sql`${courses.faculty} IS NOT NULL`)
    .orderBy(courses.faculty);

  return (
    <ReviewsClient
      reviews={filtered.map((r) => ({
        ...r,
        created_at: r.created_at?.toISOString() ?? null,
      }))}
      faculties={facultyRows.map((r) => r.faculty!)}
      total={total}
      page={page}
      limit={limit}
      search={search}
      faculty={faculty}
      grade={grade}
      sort={sort}
    />
  );
}
