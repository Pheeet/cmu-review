import { db } from '@/db';
import { course_requests, courses, rate_limit_logs } from '@/db/schema';
import { count, sql, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db
    .select({
      code: course_requests.code,
      count: count(),
    })
    .from(course_requests)
    .groupBy(course_requests.code)
    .orderBy(sql`count(*) DESC`);

  const existing = await db
    .select({ code: courses.code })
    .from(courses);

  const existingSet = new Set(existing.map(r => r.code));
  const filtered = rows.filter(r => !existingSet.has(r.code));

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  try {
    // CSRF: reject requests from external origins
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { code, reason, fingerprint_id } = body;

    if (!code?.trim() || !fingerprint_id) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสวิชา' }, { status: 400 });
    }

    // Rate limit: max 5 requests per hour per fingerprint
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [attemptRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rate_limit_logs)
      .where(sql`${rate_limit_logs.ip} = ${fingerprint_id} AND ${rate_limit_logs.action} = 'course_request' AND ${rate_limit_logs.created_at} > ${oneHourAgo}`);

    if ((attemptRow?.count ?? 0) >= 5) {
      return NextResponse.json({ error: 'ร้องขอเยอะเกินไป ลองใหม่ภายหลัง' }, { status: 429 });
    }

    await db.insert(rate_limit_logs).values({ ip: fingerprint_id, action: 'course_request' });

    await db.insert(course_requests).values({
      code: code.trim().toUpperCase(),
      reason: reason?.trim() || null,
      fingerprint_id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('course-requests POST error:', err);
    return NextResponse.json({ error: err?.message || 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
