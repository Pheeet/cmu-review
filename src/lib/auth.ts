import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signToken(payload: { id: string; username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as { id: string; username: string };
}

export async function getSession(): Promise<{ id: string; username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
