import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReviewForm } from './ReviewForm';

interface ReviewFormModalProps {
  courseId: string;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewFormModal({
  courseId,
  courseName,
  isOpen,
  onClose,
  onSuccess,
}: ReviewFormModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-100"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-[#F0F0EE]">
              <div>
                <h4 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                  เขียนรีวิววิชานี้
                </h4>
                <p className="text-sm font-medium text-[#9E76B4] mt-1 line-clamp-1 pr-4">
                  {courseName}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  แชร์ประสบการณ์จริง เพื่อเพื่อนนักศึกษาคนอื่น
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scrollable Area */}
            <div className="overflow-y-auto">
              <ReviewForm
                courseId={courseId}
                onSuccess={() => {
                  onSuccess();
                  onClose();
                }}
                onCancel={onClose}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
