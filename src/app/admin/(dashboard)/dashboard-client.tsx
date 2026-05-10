'use client';

import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, AlertTriangle } from 'lucide-react';

interface Stats {
  courses: number;
  reviews: number;
  reported: number;
}

interface RecentReview {
  id: string;
  course_code: string | null;
  course_name: string | null;
  reviewer_name: string | null;
  grade: string | null;
  created_at: string | null;
}

interface TopReported {
  id: string;
  course_code: string | null;
  course_name: string | null;
  reviewer_name: string | null;
  comment: string;
  report_count: number | null;
}

const statCards = [
  { key: 'courses' as const, label: 'รายวิชาทั้งหมด', icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
  { key: 'reviews' as const, label: 'รีวิวทั้งหมด', icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'reported' as const, label: 'รีวิวที่ถูก Report', icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
];

function formatDate(iso: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '...' : text;
}

export function DashboardClient({
  stats,
  recentReviews,
  topReported,
}: {
  stats: Stats;
  recentReviews: RecentReview[];
  topReported: TopReported[];
}) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-neutral-900">
                {stats[card.key].toLocaleString()}
              </div>
              <div className="text-sm text-neutral-400 font-medium">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Reviews */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">รีวิวล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">วิชา</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ผู้รีวิว</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">เกรด</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {recentReviews.map((r) => (
                <tr key={r.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-semibold text-neutral-700">{r.course_code}</span>
                    <span className="text-neutral-400 ml-2 text-xs">{r.course_name}</span>
                  </td>
                  <td className="px-6 py-3 text-neutral-600">{r.reviewer_name || 'ไม่ระบุ'}</td>
                  <td className="px-6 py-3">
                    {r.grade && r.grade !== 'ไม่ระบุ' ? (
                      <span className="text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{r.grade}</span>
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-neutral-400 text-xs">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Top Reported */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-bold text-neutral-900">รีวิวที่ถูก Report มากที่สุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">วิชา</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ผู้รีวิว</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Comment</th>
                <th className="text-left px-6 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Report</th>
              </tr>
            </thead>
            <tbody>
              {topReported.map((r) => (
                <tr key={r.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-semibold text-neutral-700">{r.course_code}</span>
                    <span className="text-neutral-400 ml-2 text-xs">{r.course_name}</span>
                  </td>
                  <td className="px-6 py-3 text-neutral-600">{r.reviewer_name || 'ไม่ระบุ'}</td>
                  <td className="px-6 py-3 text-neutral-500 text-xs max-w-[200px] truncate">{truncate(r.comment, 80)}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-full">{r.report_count}</span>
                  </td>
                </tr>
              ))}
              {topReported.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-400 text-sm">
                    ไม่มีรีวิวที่ถูก report
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
