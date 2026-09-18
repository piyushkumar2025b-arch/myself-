import React, { useState } from 'react';
import { ProjectFile } from '../../types/portfolio';
import { formatFileSize, isTextOrCodeCategory } from '../../utils/fileUtils';
import { 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive, 
  FileCheck, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Maximize2
} from 'lucide-react';

interface FilePreviewerProps {
  file: ProjectFile;
  onOpenLightbox?: (imageUrl: string, title?: string) => void;
  onDownload?: (file: ProjectFile) => void;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({
  file,
  onOpenLightbox,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleCopy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
      return;
    }
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

  // 1. IMAGE PREVIEW
  if (file.fileCategory === 'image') {
    const src = file.publicUrl || '';
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-[#080b11] rounded-xl border border-white/10 overflow-hidden relative group">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d111a] animate-pulse">
            <ImageIcon className="w-8 h-8 text-slate-500 animate-bounce" />
          </div>
        )}
        <img
          src={src}
          alt={file.fileName}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-xl cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
          onClick={() => onOpenLightbox?.(src, file.fileName)}
        />
        <div className="mt-3 flex items-center justify-between w-full pt-3 border-t border-white/10 text-xs text-slate-400">
          <span>{formatFileSize(file.fileSize)}</span>
          <button
            onClick={() => onOpenLightbox?.(src, file.fileName)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Expand Image</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. VIDEO PREVIEW
  if (file.fileCategory === 'video') {
    return (
      <div className="flex flex-col items-center p-4 bg-[#080b11] rounded-xl border border-white/10">
        <video
          controls
          preload="metadata"
          className="w-full max-h-[55vh] rounded-lg bg-black shadow-lg"
          src={file.publicUrl}
        >
          Your browser does not support HTML5 video playback.
        </video>
        <div className="mt-3 flex items-center justify-between w-full text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-purple-400" />
            <span>Video format: {file.fileExtension.toUpperCase()}</span>
          </span>
          <span>{formatFileSize(file.fileSize)}</span>
        </div>
      </div>
    );
  }

  // 3. AUDIO PREVIEW
  if (file.fileCategory === 'audio') {
    return (
      <div className="flex flex-col items-center p-6 bg-[#080b11] rounded-xl border border-white/10 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
          <Music className="w-8 h-8" />
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold text-white">{file.fileName}</div>
          <div className="text-xs text-slate-400 mt-1">{formatFileSize(file.fileSize)}</div>
        </div>
        <audio
          controls
          className="w-full max-w-md pt-2"
          src={file.publicUrl}
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  // 4. PDF PREVIEW
  if (file.fileCategory === 'pdf') {
    return (
      <div className="flex flex-col w-full h-[65vh] bg-[#080b11] rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#121622] border-b border-white/10 text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-400" />
            <span>{file.fileName} ({formatFileSize(file.fileSize)})</span>
          </span>
          <div className="flex items-center gap-2">
            {file.publicUrl && (
              <a
                href={file.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}
            <button
              onClick={handleDownload}
              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
        <div className="flex-1 w-full h-full relative bg-slate-900">
          <iframe
            src={`${file.publicUrl || ''}#toolbar=1`}
            title={file.fileName}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  // 5. CODE / TEXT / DATA PREVIEW
  if (isTextOrCodeCategory(file.fileCategory) && file.content !== undefined) {
    const lines = file.content.split('\n');
    return (
      <div className="flex flex-col w-full rounded-xl bg-[#07090e] border border-white/10 overflow-hidden font-mono text-xs">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#10141e] border-b border-white/10">
          <div className="flex items-center gap-2 text-slate-300">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{file.fileName}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-400">
              {lines.length} lines • {formatFileSize(file.fileSize)}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Read-only Code View with line numbers */}
        <div className="max-h-[60vh] overflow-y-auto p-4 select-text">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-white/[0.03]">
                  <td className="w-10 pr-4 text-right select-none text-slate-600 font-mono text-[11px] align-top">
                    {idx + 1}
                  </td>
                  <td className="text-slate-200 whitespace-pre font-mono text-[12px] leading-relaxed break-all">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 6. ARCHIVE / ZIP PREVIEW
  if (file.fileCategory === 'archive') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#080b11] rounded-xl border border-white/10 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Archive className="w-8 h-8" />
        </div>
        <div>
          <div className="text-base font-bold text-white">{file.fileName}</div>
          <div className="text-xs text-slate-400 mt-1">Compressed Archive • {formatFileSize(file.fileSize)}</div>
        </div>
        <p className="text-xs text-slate-400 max-w-sm">
          This is a compressed archive containing project assets or source files. Download to extract and view contents.
        </p>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Download Archive ({formatFileSize(file.fileSize)})</span>
        </button>
      </div>
    );
  }

  // 7. GENERIC / DOCUMENT PREVIEW FALLBACK
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#080b11] rounded-xl border border-white/10 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
        <FileCheck className="w-8 h-8" />
      </div>
      <div>
        <div className="text-base font-bold text-white">{file.fileName}</div>
        <div className="text-xs text-slate-400 mt-1">
          {file.fileCategory.toUpperCase()} • {formatFileSize(file.fileSize)}
        </div>
      </div>
      <p className="text-xs text-slate-400 max-w-sm">
        Direct inline preview is not supported for this file format in the browser. You can download the file directly.
      </p>
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-cyan-500/20"
      >
        <Download className="w-4 h-4" />
        <span>Download File ({formatFileSize(file.fileSize)})</span>
      </button>
    </div>
  );
};
