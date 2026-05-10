'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { admins, reviews } from '@/db/schema';
import { signToken } from '@/lib/auth';

export async function loginAction(_prev: unknown, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'กรุณากรอกข้อมูลให้ครบ' };
  }

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
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  await db.update(admins).set({ last_login: new Date() }).where(eq(admins.id, admin.id));

  redirect('/admin');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/admin/login');
}

export async function dismissReport(id: string) {
  await db.update(reviews).set({ report_count: 0 }).where(eq(reviews.id, id));
  revalidatePath('/admin/reports');
  revalidatePath('/admin/reviews');
  return { success: true };
}

export async function deleteReview(id: string) {
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidatePath('/admin/reports');
  revalidatePath('/admin/reviews');
  return { success: true };
}

export async function bulkDeleteReviews(ids: string[]) {
  if (ids.length === 0) return { success: true };
  await db.delete(reviews).where(inArray(reviews.id, ids));
  revalidatePath('/admin/reports');
  revalidatePath('/admin/reviews');
  return { success: true };
}
