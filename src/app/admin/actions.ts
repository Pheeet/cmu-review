'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { admins, reviews, rate_limit_logs } from '@/db/schema';
import { signToken, getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function loginAction(_prev: unknown, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'กรุณากรอกข้อมูลให้ครบ' };
  }

  // Rate limit: max 5 attempts per 15 min per IP
  const headersList = await (await import('next/headers')).headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [attemptRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rate_limit_logs)
    .where(sql`${rate_limit_logs.ip} = ${ip} AND ${rate_limit_logs.action} = 'login' AND ${rate_limit_logs.created_at} > ${fifteenMinAgo}`);

  if ((attemptRow?.count ?? 0) >= 5) {
    return { error: 'ลองใหม่อีกครั้งใน 15 นาที' };
  }

  // Log this attempt
  await db.insert(rate_limit_logs).values({ ip, action: 'login' });

  const [admin] = await db.select().from(admins).where(eq(admins.username, username)).limit(1);

  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  }

  const token = await signToken({ id: admin.id, username: admin.username });

  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  await db.update(admins).set({ last_login: new Date() }).where(eq(admins.id, admin.id));

  redirect('/admin');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  // Invalidate all tokens for this admin
  if (token) {
    try {
      const { verifyToken } = await import('@/lib/auth');
      const decoded = await verifyToken(token);
      await db.update(admins).set({ token_invalidated_at: new Date() }).where(eq(admins.id, decoded.id));
    } catch {}
  }

  cookieStore.delete('admin_token');
  redirect('/admin/login');
}

export async function dismissReport(id: string) {
  await requireAdmin();
  await db.update(reviews).set({ report_count: 0 }).where(eq(reviews.id, id));
  revalidatePath('/admin');
  revalidatePath('/admin/reports');
  revalidatePath('/admin/reviews');
  return { success: true };
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidatePath('/admin');
  revalidatePath('/admin/reports');
  revalidatePath('/admin/reviews');
  return { success: true };
}

export async function bulkDeleteReviews(ids: string[]) {
  await requireAdmin();
  if (ids.length === 0) return { success: true };
  await db.delete(reviews).where(inArray(reviews.id, ids));
  revalidatePath('/admin');
  revalidatePath('/admin/reports');
  revalidatePath('/admin/reviews');
  return { success: true };
}
