'use client';

import { useActionState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Lock, User } from 'lucide-react';
import { loginAction } from '../actions';

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#9E76B4] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
            รีวิวตัวฟรี มช.
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Admin Panel</p>
        </div>

        {/* Form */}
        <form
          action={formAction}
          className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4"
        >
          {state?.error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-4 py-3 rounded-xl"
            >
              {state.error}
            </motion.div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              ชื่อผู้ใช้
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="admin"
                className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              รหัสผ่าน
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#9E76B4]/20 focus:border-[#9E76B4] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#9E76B4] hover:bg-[#8A5DA1] active:bg-[#7A4E91] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md text-sm tracking-wide mt-2"
          >
            {pending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
