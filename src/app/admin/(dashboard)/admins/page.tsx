import { db } from '@/db';
import { admins } from '@/db/schema';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminsClient } from './client';

export const dynamic = 'force-dynamic';

export default async function AdminAdminsPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const rows = await db.select().from(admins).orderBy(admins.created_at);

  return (
    <AdminsClient
      admins={rows.map((a) => ({
        id: a.id,
        username: a.username,
        created_at: a.created_at?.toISOString() ?? null,
        last_login: a.last_login?.toISOString() ?? null,
      }))}
      currentUserId={session.id}
    />
  );
}
