import React, { useState, useEffect, useRef } from 'react';
import { PublicDocument } from '../../types/portfolio';
import { DocumentService } from '../../services/documentService';
import { AuthService } from '../../services/authService';
import { sanitizeUrl } from '../../utils/security';
import { formatFileSize, getFileExtension } from '../../utils/fileUtils';
import { 
  X, 
  Download, 
  Upload, 
  FileText, 
  FileCode, 
  Database, 
  Archive, 
  File, 
  Search, 
  Trash2, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Loader2, 
  Cloud, 
  Sparkles,
  ShieldCheck,
  Filter,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublicDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminMode?: boolean;
  onToast?: (title: string, description: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIES = [
  'All',
  'Resume & CV',
  'Research Papers',
  'Guides & Notes',
  'Cheat Sheets',
  'Code & Datasets',
  'Other'
];

export const PublicDocumentModal: React.FC<PublicDocumentModalProps> = ({
  isOpen,
  onClose,
  isAdminMode,
  onToast,
}) => {
  // Authenticated admin verification
  const [isAdmin, setIsAdmin] = useState(isAdminMode ?? false);

  useEffect(() => {
    if (isAdminMode !== undefined) {
      setIsAdmin(isAdminMode);
      return;
    }
    AuthService.getCurrentState().then((s) => setIsAdmin(s.isAuthenticated && s.isAdmin));
    const unsubscribe = AuthService.onAuthStateChange((s) => setIsAdmin(s.isAuthenticated && s.isAdmin));
    return () => unsubscribe();
  }, [isAdminMode]);

  const isEditingEnabled = isAdmin;

  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Upload Form State (Only used when isEditingEnabled is true)
  const [isUploadingOpen, setIsUploadingOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Guides & Notes');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents
  useEffect(() => {
    if (!isOpen) return;

    loadDocuments();

    // Listen for real-time document updates
    const handleUpdate = () => {
      loadDocuments();
    };
    window.addEventListener('portfolio_documents_updated', handleUpdate);
    return () => window.removeEventListener('portfolio_documents_updated', handleUpdate);
  }, [isOpen]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadFile(file);
    if (!uploadTitle) {
      // Clean base name for title
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadTitle(nameWithoutExt);
    }
    setUploadError(null);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please choose a file to upload.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    if (!isEditingEnabled) {
      setUploadError('Authorization Error: Only authenticated administrators can upload documents.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    setUploadStatus('Validating and preparing file...');

    try {
      const res = await DocumentService.uploadDocument(
        uploadFile,
        {
          title: uploadTitle.trim(),
          description: uploadDescription.trim(),
          category: uploadCategory,
          uploadedBy: 'Admin',
        },
        (percent, status) => {
          setUploadProgress(percent);
          setUploadStatus(status);
        }
      );

      if (res.success && res.document) {
        onToast?.(
          'Document Uploaded to Supabase!',
          `"${res.document.title}" is now available for public download.`,
          'success'
        );
        // Reset form
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setIsUploadingOpen(false);
        await loadDocuments();
      } else {
        setUploadError(res.error || 'Upload failed. Please try again.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (doc: PublicDocument) => {
    if (!isEditingEnabled) {
      onToast?.('Unauthorized', 'Only authenticated administrators can delete documents.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      const res = await DocumentService.deleteDocument(doc);
      if (res.success) {
        onToast?.('Document Deleted', `"${doc.title}" has been removed from Supabase.`, 'info');
        await loadDocuments();
      } else {
        onToast?.('Delete Failed', res.error || 'Could not delete document', 'error');
      }
    } catch (err: any) {
      onToast?.('Error', err?.message || 'Delete operation failed', 'error');
    }
  };

  const handleDownload = async (doc: PublicDocument) => {
    onToast?.('Starting Download', `Downloading "${doc.fileName}"...`, 'info');
    await DocumentService.triggerDownload(doc);
    // Update local download count
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, downloadCount: d.downloadCount + 1 } : d));
  };

  const handleCopyLink = (doc: PublicDocument) => {
    const link = sanitizeUrl(doc.publicUrl || window.location.href);
    navigator.clipboard.writeText(link);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
    onToast?.('Link Copied', 'Download link copied to clipboard.', 'info');
  };

  // Filtered documents
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      doc.title.toLowerCase().includes(query) ||
      (doc.description && doc.description.toLowerCase().includes(query)) ||
      doc.fileName.toLowerCase().includes(query) ||
      doc.fileExtension.toLowerCase().includes(query) ||
      doc.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const getFileIcon = (ext: string, mime: string) => {
    const cleanExt = (ext || '').toLowerCase();
    if (cleanExt === 'pdf' || mime.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-400" />;
    }
    if (['py', 'js', 'ts', 'jsx', 'tsx', 'cpp', 'java', 'html', 'css', 'json'].includes(cleanExt)) {
      return <FileCode className="w-5 h-5 text-emerald-400" />;
    }
    if (['csv', 'xlsx', 'xls', 'sql', 'db'].includes(cleanExt)) {
      return <Database className="w-5 h-5 text-purple-400" />;
    }
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(cleanExt)) {
      return <Archive className="w-5 h-5 text-amber-400" />;
    }
    return <File className="w-5 h-5 text-cyan-400" />;
  };

  if (!isOpen) return null;

  return (
    <div 
      id="public-document-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-4xl bg-[#0c1017] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-[#0f1420]/80 backdrop-blur-md">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white tracking-tight">Public Document Repository</h2>
                {isEditingEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" /> Admin Edit Mode Active
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cloud className="w-3 h-3" /> Free Public Downloads
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                {isEditingEnabled 
                  ? 'Admin editing active: Upload, delete, or manage files stored in Supabase. Public users can download all documents for free.'
                  : 'Official documents, guides, and resources available for free public download and reference.'}
              </p>
            </div>
          </div>

          <button
            id="close-document-modal"
            onClick={onClose}
            aria-label="Close document modal"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Action Bar */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-[#090d14] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="document-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title, keyword, extension..."
              className="w-full pl-9 pr-4 py-2 bg-[#121824] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Admin controls: ONLY rendered when isEditingEnabled is true in code */}
          {isEditingEnabled && (
            <div className="flex items-center gap-2 justify-end">
              <button
                id="admin-upload-toggle-btn"
                onClick={() => setIsUploadingOpen(!isUploadingOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploadingOpen ? 'Close Upload Panel' : 'Upload Any File'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#0a0e16] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Admin Upload Zone (Only visible when isEditingEnabled is true and toggled open) */}
          <AnimatePresence>
            {isUploadingOpen && isEditingEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-5"
              >
                <form 
                  onSubmit={handleUploadSubmit}
                  className="p-5 rounded-xl bg-[#111724] border border-emerald-500/40 shadow-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Upload className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Upload New Document to Supabase</h3>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Supports ANY File Type
                    </span>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFileSelect(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? 'border-emerald-400 bg-emerald-500/10' 
                        : uploadFile 
                          ? 'border-emerald-500/50 bg-[#0e1420]' 
                          : 'border-white/15 hover:border-emerald-500/40 bg-[#090d15]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileSelect(e.target.files)}
                      className="hidden"
                    />

                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        {getFileIcon(getFileExtension(uploadFile.name), uploadFile.type)}
                        <div className="text-left">
                          <p className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                            {uploadFile.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatFileSize(uploadFile.size)} • {uploadFile.type || 'Binary / Custom format'}
                          </p>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium ml-2">Click to change</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-slate-200">
                          Click to select or drag and drop any file
                        </p>
                        <p className="text-xs text-slate-500">
                          PDF, Word, Excel, PowerPoint, ZIP, Python, JSON, Images, Audio, CAD, Text, etc.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Document Title *
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Distributed System Design Playbook"
                        required
                        className="w-full px-3 py-2 bg-[#0a0e16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0a0e16] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Resume & CV">Resume & CV</option>
                        <option value="Research Papers">Research Papers</option>
                        <option value="Guides & Notes">Guides & Notes</option>
                        <option value="Cheat Sheets">Cheat Sheets</option>
                        <option value="Code & Datasets">Code & Datasets</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Description / Abstract (Optional)
                    </label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Brief overview of what readers or workers can learn or use this file for..."
                      rows={2}
                      className="w-full px-3 py-2 bg-[#0a0e16] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{uploadStatus}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadingOpen(false);
                        setUploadFile(null);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !uploadFile}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving to Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Upload & Save to Supabase</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm">Connecting to Supabase Storage & Database...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-4 bg-[#0e131d] rounded-2xl border border-white/[0.06]">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white mb-1">
                {searchQuery ? 'No documents matched your search' : 'No documents available yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                {searchQuery 
                  ? `No files matched "${searchQuery}". Try a different keyword or category.`
                  : isEditingEnabled
                    ? 'No public documents have been uploaded yet. Click below to upload your first document for visitors to download for free.'
                    : 'Official documents, guides, and project files published by the author will appear here for free download.'}
              </p>
              {isEditingEnabled && !isUploadingOpen && (
                <button
                  onClick={() => setIsUploadingOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload the First Document</span>
                </button>
              )}
            </div>
          ) : (
            /* Documents List Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  id={`doc-card-${doc.id}`}
                  className="group relative flex flex-col justify-between p-4 rounded-xl bg-[#101522]/90 hover:bg-[#131a2a] border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-emerald-500/5"
                >
                  <div>
                    {/* Top Row: File icon & Category badge */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[#0c1017] border border-white/10 group-hover:border-emerald-500/30 transition-colors">
                          {getFileIcon(doc.fileExtension, doc.mimeType)}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/5">
                          .{doc.fileExtension || 'bin'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {doc.category}
                        </span>

                        {/* Admin Delete Action (Only visible when isEditingEnabled is true) */}
                        {isEditingEnabled && (
                          <button
                            onClick={() => handleDeleteDocument(doc)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete file from Supabase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1 mb-1">
                      {doc.title}
                    </h3>

                    {/* Description */}
                    {doc.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {doc.description}
                      </p>
                    )}

                    {/* File Meta */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
                      <span className="font-mono text-slate-400">{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>{doc.downloadCount} {doc.downloadCount === 1 ? 'download' : 'downloads'}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{doc.fileName}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    {/* Primary Free Download CTA */}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-semibold text-xs border border-emerald-500/30 hover:border-emerald-500 transition-all active:scale-[0.98]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Free</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(doc)}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 transition-colors"
                      title="Copy file link"
                    >
                      {copiedId === doc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Preview / Read Button if public URL available */}
                    {doc.publicUrl && (
                      <a
                        href={doc.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 transition-colors"
                        title="Open in new tab / Preview"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0c1017] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Public downloads are free and open for educational and professional work.</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'} available
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 transition-colors text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
