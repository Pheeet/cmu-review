'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Flag,
  MessageSquare,
  LogOut,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'ภาพรวม', icon: LayoutDashboard, exact: true },
  { href: '/admin/reports', label: 'รีวิวที่ถูกรายงาน', icon: Flag, badge: true },
  { href: '/admin/courses', label: 'จัดการรายวิชา', icon: BookOpen, dot: true },
  { href: '/admin/reviews', label: 'จัดการรีวิว', icon: MessageSquare },
];

export function AdminSidebar({
  username,
  pendingReportCount,
  hasCourseRequests,
  logoutAction,
}: {
  username: string;
  pendingReportCount: number;
  hasCourseRequests: boolean;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleNav = useCallback((href: string) => {
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }, [router]);

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden w-11 h-11 bg-white border border-neutral-200 rounded-xl shadow-sm flex items-center justify-center text-neutral-700 active:scale-95 transition-transform"
        aria-label="เปิดเมนู"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-neutral-200/80 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-between">
            <button onClick={() => { router.push('/admin'); setMobileOpen(false); }} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#9E76B4] to-[#7B5A94] rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm text-neutral-900 leading-tight group-hover:text-[#9E76B4] transition-colors">รีวิวตัวฟรี มช.</div>
                <div className="text-[10px] font-bold text-[#9E76B4] uppercase tracking-wider">ระบบแอดมิน</div>
              </div>
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"
              aria-label="ปิดเมนู"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <div className="px-3 py-2 mb-1">
            <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">เมนู</span>
          </div>
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const isNavigating = pendingHref === item.href;

            return (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                onMouseEnter={() => router.prefetch(item.href)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left cursor-pointer ${
                  isActive || isNavigating
                    ? 'bg-[#9E76B4]/10 text-[#9E76B4] font-semibold'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-y-0 left-0 flex items-center">
                    <motion.div
                      layoutId="sidebar-active"
                      className="w-[3px] h-5 bg-[#9E76B4] rounded-r-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  </div>
                )}
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
                {item.dot && hasCourseRequests && (
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card + Logout */}
        <div className="px-3 py-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-neutral-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9E76B4] to-[#7B5A94] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-neutral-800 truncate block">{username}</span>
              <span className="text-[10px] text-neutral-400">ผู้ดูแลระบบ</span>
            </div>
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
    </>
  );
}
