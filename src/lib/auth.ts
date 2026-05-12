import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signToken(payload: { id: string; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as { id: string; username: string; iat: number };
}

export async function getSession(): Promise<{ id: string; username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  try {
    const decoded = await verifyToken(token);
    // Check if token was issued before invalidation
    const [admin] = await db.select({ token_invalidated_at: admins.token_invalidated_at })
      .from(admins).where(eq(admins.id, decoded.id)).limit(1);
    if (admin?.token_invalidated_at && decoded.iat < Math.floor(new Date(admin.token_invalidated_at).getTime() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
