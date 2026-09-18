import React, { useEffect, useRef } from 'react';
import { ProjectFile } from '../../types/portfolio';
import { FilePreviewer } from './FilePreviewer';
import { formatFileSize } from '../../utils/fileUtils';
import { X, Download, FileText, FileCode, Image as ImageIcon, Video, Music, Archive, FileCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

interface FilePreviewModalProps {
  file: ProjectFile | null;
  onClose: () => void;
  onOpenLightbox?: (imageUrl: string, title?: string) => void;
  onDeleteFile?: (file: ProjectFile) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
  onOpenLightbox,
  onDeleteFile,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!file) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const getCategoryIcon = () => {
    switch (file.fileCategory) {
      case 'code': return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'video': return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-pink-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      case 'archive': return <Archive className="w-4 h-4 text-amber-400" />;
      default: return <FileCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleDownload = () => {
    if (file.publicUrl) {
      const link = document.createElement('a');
      link.href = file.publicUrl;
      link.download = file.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-preview-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          ref={modalRef}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-[#0b0e17] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-10 my-4 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#111624] border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                {getCategoryIcon()}
              </div>
              <div className="min-w-0">
                <h3 id="file-preview-title" className="text-sm sm:text-base font-bold text-white truncate">
                  {file.fileName}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="capitalize">{file.fileCategory}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.fileSize)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onDeleteFile && (
                <button
                  onClick={() => {
                    if (window.confirm(`Permanently delete file "${file.fileName}" from Supabase storage and project repository?`)) {
                      onClose();
                      onDeleteFile(file);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-colors cursor-pointer"
                  title="Delete file from Supabase"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
              <button
                onClick={handleDownload}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Close file preview"
                className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            <FilePreviewer 
              file={file} 
              onOpenLightbox={onOpenLightbox}
              onDownload={handleDownload}
            />
          </div>

          {/* Footer on mobile */}
          <div className="sm:hidden flex items-center gap-2 p-4 bg-[#111624] border-t border-white/10">
            {onDeleteFile && (
              <button
                onClick={() => {
                  if (window.confirm(`Permanently delete file "${file.fileName}" from Supabase storage?`)) {
                    onClose();
                    onDeleteFile(file);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Download ({formatFileSize(file.fileSize)})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
