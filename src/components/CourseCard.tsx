'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, Star } from 'lucide-react';
import { Course } from '@/types';
import { getFacultyColor } from '@/lib/facultyColors';

interface CourseCardProps {
  course: Course;
  reviewCount: number;
  avgGrade?: string | null;
  onClick: () => void;
}

export function CourseCard({ course, reviewCount, avgGrade, onClick }: CourseCardProps) {
  const fc = getFacultyColor(course.faculty);

  return (
    <motion.div
      onClick={onClick}
      layout="position"
      whileHover={{ 
        y: -4, 
        borderColor: fc.border,
        transition: { duration: 0.2, ease: 'easeOut' } 
      }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
      className="group relative bg-white rounded-2xl border shadow-sm hover:shadow-lg cursor-pointer flex flex-col h-full transition-all duration-200"
      style={{ borderColor: '#E8E8E6' }}
    >
      <div className="p-5 flex flex-col h-full">
        {/* Code pill + credits */}
        <div className="flex justify-between items-start mb-3">
          <span
            className="font-mono font-bold text-sm tracking-wide px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: fc.bg, color: fc.text }}
          >
            {course.code}
          </span>
          {course.credits !== null && (
            <span className="text-xs font-medium text-neutral-400 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-full flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {course.credits} หน่วยกิต
            </span>
          )}
        </div>

        {/* Course name — 3. changes colour via Tailwind group-hover */}
        <div className="flex-1 mb-4">
          <h3 className="font-bold text-base text-neutral-900 leading-tight mb-1 transition-colors duration-200 group-hover:text-[#9E76B4]">
            {course.name_en || 'Unknown Course'}
          </h3>
          {course.name_th && (
            <p className="text-sm text-neutral-400 font-medium leading-snug line-clamp-1 mb-2">
              {course.name_th}
            </p>
          )}
          <span
            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: fc.bg, color: fc.text }}
          >
            {course.faculty || 'ไม่ระบุคณะ'}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between h-6">
            <div className="flex-1">
              {reviewCount > 0 && avgGrade && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {avgGrade}
                </div>
              )}
            </div>

            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {reviewCount}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
