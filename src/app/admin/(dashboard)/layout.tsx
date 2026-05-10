import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { eq, gt, count } from 'drizzle-orm';
import { db } from '@/db';
import { reviews } from '@/db/schema';
import { AdminSidebar } from './sidebar';
import { logoutAction } from '@/app/admin/actions';

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; username: string };
  } catch {
    return null;
  }
}

// Cached for 30s — avoids hitting DB on every sidebar navigation
let cachedCount = 0;
let cachedAt = 0;

async function getPendingReportCount(): Promise<number> {
  const now = Date.now();
  if (now - cachedAt < 30_000) return cachedCount;

  try {
    const [result] = await db
      .select({ count: count() })
      .from(reviews)
      .where(gt(reviews.report_count, 0));
    cachedCount = result.count;
    cachedAt = now;
    return cachedCount;
  } catch {
    return cachedCount;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');

  const pendingCount = await getPendingReportCount();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar username={admin.username} pendingReportCount={pendingCount} logoutAction={logoutAction} />
      <main className="flex-1 ml-[240px] bg-neutral-50 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
