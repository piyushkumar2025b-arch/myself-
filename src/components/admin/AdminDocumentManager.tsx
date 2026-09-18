import React, { useState, useEffect, useRef } from 'react';
import { PublicDocument } from '../../types/portfolio';
import { DocumentService } from '../../services/documentService';
import { formatFileSize, getFileExtension } from '../../utils/fileUtils';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Loader2, 
  Cloud, 
  Search,
  FileCode,
  Database,
  Archive,
  File,
  Copy
} from 'lucide-react';

interface AdminDocumentManagerProps {
  adminEmail?: string;
}

export const AdminDocumentManager: React.FC<AdminDocumentManagerProps> = ({ adminEmail }) => {
  const [documents, setDocuments] = useState<PublicDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadingOpen, setIsUploadingOpen] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Guides & Notes');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocs();
    const handleUpdate = () => loadDocs();
    window.addEventListener('portfolio_documents_updated', handleUpdate);
    return () => window.removeEventListener('portfolio_documents_updated', handleUpdate);
  }, []);

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const docs = await DocumentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadFile(file);
    if (!uploadTitle) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadTitle(baseName);
    }
    setUploadError(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Document title is required.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(15);
    setUploadStatus('Processing file...');

    try {
      const res = await DocumentService.uploadDocument(
        uploadFile,
        {
          title: uploadTitle.trim(),
          description: uploadDescription.trim(),
          category: uploadCategory,
          uploadedBy: adminEmail || 'Admin',
        },
        (percent, message) => {
          setUploadProgress(percent);
          setUploadStatus(message);
        }
      );

      if (res.success) {
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setIsUploadingOpen(false);
        await loadDocs();
      } else {
        setUploadError(res.error || 'Failed to upload document to Supabase.');
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: PublicDocument) => {
    if (!window.confirm(`Delete "${doc.title}" from Supabase?`)) return;
    const res = await DocumentService.deleteDocument(doc);
    if (res.success) {
      await loadDocs();
    } else {
      alert(res.error || 'Failed to delete document');
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  const filtered = documents.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.title.toLowerCase().includes(q) ||
      d.fileName.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Public Document Repository</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5" /> Supabase Storage
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Admins can upload ANY file type. Public visitors can freely download and view them.
          </p>
        </div>

        <button
          onClick={() => setIsUploadingOpen(!isUploadingOpen)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)]"
        >
          {isUploadingOpen ? (
            <span>Close Upload Form</span>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Any File</span>
            </>
          )}
        </button>
      </div>

      {/* Upload Form */}
      {isUploadingOpen && (
        <form
          onSubmit={handleUpload}
          className="p-5 rounded-2xl bg-[#111624] border border-emerald-500/40 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Document Uploader (Any File Type Accepted)</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">portfolio-assets/documents/</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-white/20 hover:border-emerald-500/50 rounded-xl p-5 text-center cursor-pointer bg-[#0c1017] transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
            />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                {getFileIcon(getFileExtension(uploadFile.name), uploadFile.type)}
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{uploadFile.name}</p>
                  <p className="text-xs text-slate-400 font-mono">
                    {formatFileSize(uploadFile.size)} • {uploadFile.type || 'Custom binary/raw file'}
                  </p>
                </div>
                <span className="text-xs text-emerald-400 ml-3 underline">Change File</span>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-200">
                  Click to select or drag and drop any file from your device
                </p>
                <p className="text-[11px] text-slate-500">
                  Accepts PDF, Word, Excel, PowerPoint, ZIP, Python, JSON, Markdown, Images, CAD, etc.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Title *
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Distributed System Architecture Blueprint"
                required
                className="w-full px-3 py-1.5 bg-[#090b12] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#090b12] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
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
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Short overview of document contents or use case..."
              rows={2}
              className="w-full px-3 py-1.5 bg-[#090b12] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {isUploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{uploadStatus}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
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

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsUploadingOpen(false);
                setUploadFile(null);
              }}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !uploadFile}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  <span>Upload & Save to Supabase</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter documents..."
          className="w-full pl-8 pr-3 py-1.5 bg-[#121624] border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs">Fetching Supabase document repository...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5 space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No documents found</p>
          <p className="text-xs text-slate-500">Click "Upload Any File" to upload files to Supabase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-xl bg-[#121624] border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#0c1017]">
                      {getFileIcon(doc.fileExtension, doc.mimeType)}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-300">
                      .{doc.fileExtension}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {doc.category}
                    </span>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete from Supabase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mb-1 truncate">{doc.title}</h4>
                {doc.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{doc.description}</p>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                  <span className="font-mono">{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{doc.downloadCount} downloads</span>
                  <span>•</span>
                  <span className="truncate max-w-[120px]">{doc.fileName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => DocumentService.triggerDownload(doc)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-semibold text-xs transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => handleCopyLink(doc.publicUrl, doc.id)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Copy direct file URL"
                >
                  {copiedId === doc.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {doc.publicUrl && (
                  <a
                    href={doc.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="Open URL"
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
  );
};
