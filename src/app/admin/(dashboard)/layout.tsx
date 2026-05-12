import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { eq, gt, count } from 'drizzle-orm';
import { db } from '@/db';
import { reviews, course_requests, courses } from '@/db/schema';
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

let cachedReportCount = 0;
let cachedReportAt = 0;

async function getPendingReportCount(): Promise<number> {
  const now = Date.now();
  if (now - cachedReportAt < 30_000) return cachedReportCount;

  try {
    const [result] = await db
      .select({ count: count() })
      .from(reviews)
      .where(gt(reviews.report_count, 0));
    cachedReportCount = result.count;
    cachedReportAt = now;
    return cachedReportCount;
  } catch {
    return cachedReportCount;
  }
}

let cachedReqCount = 0;
let cachedReqAt = 0;

async function getCourseRequestCount(): Promise<number> {
  const now = Date.now();
  if (now - cachedReqAt < 30_000) return cachedReqCount;

  try {
    const [result] = await db
      .select({ count: count() })
      .from(course_requests);
    cachedReqCount = result.count;
    cachedReqAt = now;
    return cachedReqCount;
  } catch {
    return cachedReqCount;
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
  const requestCount = await getCourseRequestCount();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar username={admin.username} pendingReportCount={pendingCount} hasCourseRequests={requestCount > 0} logoutAction={logoutAction} />
      <main className="flex-1 lg:ml-[240px] bg-[#FAF9F5] p-4 sm:p-6 lg:p-8 min-h-screen">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
