'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, ShieldCheck, Clock, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { createAdmin, deleteAdmin } from './actions';

interface AdminRow {
  id: string;
  username: string;
  created_at: string | null;
  last_login: string | null;
}

export function AdminsClient({
  admins,
  currentUserId,
}: {
  admins: AdminRow[];
  currentUserId: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreate = async () => {
    if (!form.username.trim()) {
      toast.error('กรุณากรอกชื่อผู้ใช้');
      return;
    }
    if (form.password.length < 8) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setSaving(true);
    try {
      const result = await createAdmin({ username: form.username, password: form.password });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('เพิ่มแอดมินสำเร็จ');
      setIsModalOpen(false);
      setForm({ username: '', password: '', confirm: '' });
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteAdmin(id);
        toast.success('ลบแอดมินสำเร็จ');
        setDeleteConfirm(null);
      } catch {
        toast.error('เกิดข้อผิดพลาด');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">จัดการแอดมิน</h1>
        <button
          onClick={() => {
            setForm({ username: '', password: '', confirm: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-[#9E76B4] hover:bg-[#8A5DA1] text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          เพิ่มแอดมิน
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Username</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">วันที่สร้าง</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">เข้าสู่ระบบล่าสุด</th>
                <th className="text-right px-5 py-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isSelf = a.id === currentUserId;
                return (
                  <tr key={a.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
                          {a.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-neutral-900">{a.username}</span>
                        {isSelf && (
                          <span className="text-[10px] font-bold bg-[#9E76B4]/10 text-[#9E76B4] px-2 py-0.5 rounded-full">
                            คุณ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{formatDate(a.created_at)}</td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{formatDate(a.last_login)}</td>
                    <td className="px-5 py-3 text-right">
                      {isSelf ? (
                        <span className="text-[10px] text-neutral-300 font-medium">—</span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(a.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-neutral-100">
          <span className="text-xs text-neutral-400">{admins.length} แอดมิน</span>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-100"
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-[#9E76B4]/10 rounded-xl flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#9E76B4]" />
                  </div>
                  <h3 className="text-lg font-extrabold text-neutral-900">เพิ่มแอดมิน</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    ชื่อผู้ใช้ *
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="username"
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    รหัสผ่าน (8 ตัวขึ้นไป) *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
                    ยืนยันรหัสผ่าน *
                  </label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-neutral-100 flex gap-2 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#9E76B4] hover:bg-[#8A5DA1] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? 'กำลังเพิ่ม...' : 'เพิ่มแอดมิน'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-neutral-100"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">ยืนยันการลบแอดมิน?</h3>
                <p className="text-sm text-neutral-500 mb-6">
                  แอดมินคนนี้จะไม่สามารถเข้าสู่ระบบได้อีก
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 text-sm font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    disabled={isPending}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isPending ? 'กำลังลบ...' : 'ลบ'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
