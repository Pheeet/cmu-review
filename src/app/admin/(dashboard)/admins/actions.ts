'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { admins } from '@/db/schema';

export async function createAdmin(data: { username: string; password: string }) {
  const trimmed = data.username.trim();
  const password = data.password;

  if (!trimmed || trimmed.length < 3) {
    return { error: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร' };
  }
  if (password.length < 8) {
    return { error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
  }

  const existing = await db.select().from(admins).where(eq(admins.username, trimmed)).limit(1);
  if (existing.length > 0) {
    return { error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
  }

  const hash = await bcrypt.hash(password, 12);
  await db.insert(admins).values({ username: trimmed, password_hash: hash });
  revalidatePath('/admin/admins');
  return { success: true };
}

export async function deleteAdmin(id: string) {
  await db.delete(admins).where(eq(admins.id, id));
  revalidatePath('/admin/admins');
  return { success: true };
}
