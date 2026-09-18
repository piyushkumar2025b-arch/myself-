import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Link as LinkIcon, 
  RotateCcw, 
  Check, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Database,
  Cloud,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { StorageService, UploadResult } from '../../services/storageService';
import { PortfolioService } from '../../services/portfolioService';
import { initialPortfolioData } from '../../config/portfolioData';
import { 
  getSupabaseCredentials, 
  setCustomSupabaseConfig, 
  testSupabaseConnection, 
  isSupabaseConnected 
} from '../../lib/supabase';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
  onSave: (newImageUrl: string) => void;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  currentImage,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets' | 'supabase'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage);
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResultInfo, setUploadResultInfo] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Supabase connection state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(null);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentImage);
      setUrlInput(currentImage.startsWith('http') ? currentImage : '');
      setErrorMessage(null);
      setIsSuccess(false);
      setUploadResultInfo(null);

      const creds = getSupabaseCredentials();
      setSupabaseUrlInput(creds.url);
      setSupabaseKeyInput(creds.anonKey);
      setIsSupabaseActive(isSupabaseConnected());
    }
  }, [isOpen, currentImage]);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setUploadResultInfo(null);

    try {
      const res = await StorageService.uploadFile(file, 'avatars');
      if (res.url) {
        setPreviewUrl(res.url);
        setUploadResultInfo(res);
      } else {
        setErrorMessage(res.error || 'Failed to process image');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error processing selected photo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMessage('Please enter a valid image URL');
      return;
    }
    setErrorMessage(null);
    setPreviewUrl(urlInput.trim());
    setUploadResultInfo({
      url: urlInput.trim(),
      path: 'external-url',
      isSupabaseStorage: urlInput.includes('supabase.co/storage'),
    });
  };

  const handleResetToDefault = () => {
    const defaultImg = initialPortfolioData.personal.profileImage;
    setPreviewUrl(defaultImg);
    setUrlInput('');
    setUploadResultInfo(null);
    setErrorMessage(null);
  };

  const handleSaveSupabaseCredentials = async () => {
    setSupabaseTesting(true);
    setSupabaseStatusMsg(null);

    const res = setCustomSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    if (!res.success) {
      setSupabaseStatusMsg(`Error: ${res.error}`);
      setSupabaseTesting(false);
      return;
    }

    const testRes = await testSupabaseConnection();
    setSupabaseStatusMsg(testRes.message);
    setIsSupabaseActive(testRes.success);
    setSupabaseTesting(false);
  };

  const handleConfirmSave = async () => {
    if (!previewUrl) {
      setErrorMessage('No photo selected');
      return;
    }

    setIsSuccess(true);
    // 1. Immediately apply to parent live state
    onSave(previewUrl);

    // 2. Synchronize directly to Supabase DB profiles table
    try {
      await PortfolioService.updateProfileImageDirectly(previewUrl);
    } catch (err) {
      console.warn('Direct Supabase update note:', err);
    }

    setTimeout(() => {
      onClose();
    }, 600);
  };

  const sampleAvatars = [
    { label: 'Original Portrait', url: initialPortfolioData.personal.profileImage },
    { label: 'Modern Developer (Dark)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80' },
    { label: 'Creative Designer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80' },
    { label: 'Tech Lead', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-[#0d1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121624]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Update Profile Photo
                </h3>
                {isSupabaseActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Supabase Storage Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-medium">
                    <Database className="w-3 h-3" /> Local & Cloud Storage
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Upload image directly to Supabase storage & render live in Hero
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Main Visual Preview Frame */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-[#141826] border border-white/5">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-500/30 shrink-0 bg-[#0a0d14] shadow-lg flex items-center justify-center">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2 text-emerald-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-[10px] font-semibold">Uploading...</span>
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = initialPortfolioData.personal.profileImage;
                  }}
                />
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" /> Live Render Preview
              </span>
              <h4 className="text-sm font-bold text-white truncate">Hero 3D Portrait Output</h4>
              
              {uploadResultInfo?.isSupabaseStorage ? (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg truncate">
                  Supabase CDN: <span className="font-mono text-[11px]">{uploadResultInfo.url}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isSupabaseActive 
                    ? 'Upload below to send file directly to Supabase storage bucket.'
                    : 'Saved securely and rendered directly in your portfolio components.'}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111420] border border-white/5">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'upload' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>

            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'url' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL</span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'presets' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presets</span>
            </button>

            <button
              onClick={() => setActiveTab('supabase')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'supabase' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: FILE UPLOAD DROPZONE */}
          {activeTab === 'upload' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-white/10 hover:border-emerald-500/40 bg-[#121624]/60 hover:bg-[#121624]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                  e.target.value = '';
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-white mb-1">
                Click to browse or drag & drop photo here
              </p>
              <p className="text-xs text-slate-400">
                Direct Supabase upload supporting PNG, JPG, JPEG, or WebP up to 15MB
              </p>
            </div>
          )}

          {/* TAB 2: IMAGE URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Direct Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://your-project.supabase.co/storage/v1/object/public/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyUrl()}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#141826] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                  >
                    Preview
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                You can paste direct public URLs from Supabase Storage buckets, GitHub, Unsplash, or CDN.
              </p>
            </div>
          )}

          {/* TAB 3: PRESETS */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-3">
              {sampleAvatars.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPreviewUrl(item.url);
                    setErrorMessage(null);
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    previewUrl === item.url
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#141826] border-white/5 hover:border-white/15 text-slate-300'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.label}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{item.label}</p>
                    <span className="text-[10px] text-slate-500">Click to preview</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 4: SUPABASE CONFIGURATION */}
          {activeTab === 'supabase' && (
            <div className="space-y-4 p-4 rounded-xl bg-[#121624] border border-white/5">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Supabase Backend & Storage Connection
                </h4>
                <p className="text-xs text-slate-400">
                  Connect your live Supabase project to upload avatars directly to your cloud storage bucket.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSupabaseCredentials}
                    disabled={supabaseTesting}
                    className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {supabaseTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    <span>{supabaseTesting ? 'Testing...' : 'Save & Test Supabase'}</span>
                  </button>
                </div>

                {supabaseStatusMsg && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium ${
                    supabaseStatusMsg.includes('Successfully')
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    {supabaseStatusMsg}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#121624]">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmSave}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Supabase & Live!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply & Save Photo</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

