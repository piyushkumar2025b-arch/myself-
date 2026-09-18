import React, { useEffect } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  title,
  onClose,
}) => {
  useEffect(() => {
    if (!imageUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-lg"
        />

        <div className="relative z-10 max-w-[95vw] max-h-[92vh] flex flex-col items-center">
          {/* Controls Bar */}
          <div className="w-full flex items-center justify-between pb-3 text-white px-2">
            <div className="text-sm font-semibold truncate text-slate-200">
              {title || 'Image Preview'}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={imageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Download full resolution"
              >
                <Download className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                aria-label="Close image lightbox"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image */}
          <motion.img
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={imageUrl}
            alt={title || 'Project preview'}
            referrerPolicy="no-referrer"
            className="max-h-[82vh] max-w-[90vw] object-contain rounded-xl shadow-2xl border border-white/10"
          />
        </div>
      </div>
    </AnimatePresence>
  );
};
