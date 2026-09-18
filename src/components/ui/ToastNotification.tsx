import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, X, Database } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type?: 'success' | 'info' | 'cloud' | 'error';
  avatarUrl?: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative rounded-2xl bg-[#0e131d]/95 backdrop-blur-xl p-4 sm:p-5 border border-emerald-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.7),0_0_25px_rgba(16,185,129,0.18)] overflow-hidden"
          >
            {/* Top gradient glow bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 animate-pulse" />

            <div className="flex items-start gap-3.5">
              {/* Avatar or Icon preview */}
              {toast.avatarUrl ? (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-emerald-500/50 shrink-0 bg-[#090c12] shadow-md">
                  <img
                    src={toast.avatarUrl}
                    alt="Saved avatar"
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-tl-md p-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-inner">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}

              {/* Message Details */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold tracking-wide uppercase border border-emerald-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> Saved & Persisted
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {toast.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-400 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-400" /> Stored across IndexedDB, Cache & Cloud
                  </span>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
