'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Flag,
  MessageSquare,
  Users,
  LogOut,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/courses', label: 'จัดการวิชา', icon: BookOpen },
  { href: '/admin/reports', label: 'รายงาน', icon: Flag, badge: true },
  { href: '/admin/reviews', label: 'จัดการรีวิว', icon: MessageSquare },
  { href: '/admin/admins', label: 'แอดมิน', icon: Users },
];

export function AdminSidebar({
  username,
  pendingReportCount,
  logoutAction,
}: {
  username: string;
  pendingReportCount: number;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Reset spinner when navigation completes
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const handleNav = useCallback((href: string) => {
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }, [router]);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-neutral-200 flex flex-col z-30">
      {/* Header */}
      <div className="px-5 py-6 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#9E76B4] rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-neutral-900 leading-tight">รีวิวตัวฟรี มช.</div>
            <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const isNavigating = pendingHref === item.href;

          return (
            <motion.div
              key={item.href}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={() => handleNav(item.href)}
                onMouseEnter={() => router.prefetch(item.href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left cursor-pointer ${
                  isActive || isNavigating
                    ? 'bg-purple-50 text-[#9E76B4]'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive || isNavigating ? 'text-[#9E76B4]' : ''}`} />
                <span className="flex-1">{item.label}</span>
                {isNavigating && (
                  <div className="w-3 h-3 border-2 border-[#9E76B4]/30 border-t-[#9E76B4] rounded-full animate-spin flex-shrink-0" />
                )}
                {item.badge && pendingReportCount > 0 && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full leading-none">
                    {pendingReportCount}
                  </span>
                )}
              </button>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-neutral-700 truncate">{username}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>ออกจากระบบ</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
