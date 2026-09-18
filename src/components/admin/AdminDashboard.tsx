import React, { useState, useEffect } from 'react';
import { 
  PortfolioData, 
  ProjectItem, 
  ProjectFile,
  ProjectComment,
  CommentStatus,
  SkillItem, 
  ServiceCardItem, 
  SocialLink, 
  ContactMessage,
  ExperienceItem,
  EducationItem,
  ResearchItem,
  AchievementItem
} from '../../types/portfolio';
import { PortfolioService } from '../../services/portfolioService';
import { AuthService, AuthState } from '../../services/authService';
import { StorageService } from '../../services/storageService';
import { ContactService } from '../../services/contactService';
import { ProjectFileService } from '../../services/projectFileService';
import { ProjectArchiveService } from '../../services/projectArchiveService';
import { ProjectCommentService } from '../../services/projectCommentService';
import { ProjectService } from '../../services/projectService';
import { formatFileSize } from '../../utils/fileUtils';
import { isSupabaseConfigured, isSupabaseConnected, getSupabaseTablesStatus, TableStatusInfo } from '../../lib/supabase';
import { ENABLE_ADMIN_MODE } from '../../config/adminConfig';
import { AdminDocumentManager } from './AdminDocumentManager';
import { DatabaseControlCenter } from './DatabaseControlCenter';
import { AdminExperienceManager } from './AdminExperienceManager';
import { AdminEducationManager } from './AdminEducationManager';
import { AdminResearchManager } from './AdminResearchManager';
import { AdminAchievementsManager } from './AdminAchievementsManager';
import { AdminNavigationManager } from './AdminNavigationManager';
import { AdminSectionHeadersManager } from './AdminSectionHeadersManager';
import { AdminContactFooterManager } from './AdminContactFooterManager';
import { 
  X, 
  Save, 
  Lock, 
  LogOut, 
  User, 
  FolderGit2, 
  Sparkles, 
  Briefcase, 
  Share2, 
  Mail, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Check, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  GraduationCap,
  BookOpen,
  Trophy,
  Database,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  FolderArchive,
  FileCode,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Ban,
  Copy,
  Server,
  Activity,
  Terminal,
  RotateCcw,
  Compass,
  Heading
} from 'lucide-react';

export type AdminTab = 
  | 'profile' 
  | 'projects' 
  | 'documents'
  | 'skills' 
  | 'services' 
  | 'social' 
  | 'experience' 
  | 'education' 
  | 'research' 
  | 'achievements'
  | 'navigation'
  | 'sectionHeaders'
  | 'contactFooter'
  | 'comments'
  | 'messages' 
  | 'database'
  | 'settings';

export interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioData;
  onUpdatePortfolioData: (data: PortfolioData) => void;
  initialTab?: AdminTab;
  initialEditingProject?: ProjectItem | null;
  autoAddProject?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  portfolioData,
  onUpdatePortfolioData,
  initialTab,
  initialEditingProject,
  autoAddProject,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'profile');
  const [data, setData] = useState<PortfolioData>(portfolioData);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLocalMode: !isSupabaseConfigured,
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Messages inbox state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Comments moderation state
  const [adminComments, setAdminComments] = useState<ProjectComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'spam'>('all');

  // Project editing state
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [generatingZip, setGeneratingZip] = useState(false);
  const [zipProgressStatus, setZipProgressStatus] = useState<string | null>(null);

  // Supabase Real-time Cloud Sync state
  const [projectCloudSyncMap, setProjectCloudSyncMap] = useState<Record<string, boolean>>({});
  const [checkingCloudSync, setCheckingCloudSync] = useState(false);
  const [syncingAllProjects, setSyncingAllProjects] = useState(false);
  const [syncProgressMessage, setSyncProgressMessage] = useState<string | null>(null);
  const [projectSaveProgress, setProjectSaveProgress] = useState<{ step: string; percent: number; isError?: boolean } | null>(null);
  const [tablesStatus, setTablesStatus] = useState<Record<string, TableStatusInfo>>({});
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [detailedSaveResult, setDetailedSaveResult] = useState<any>(null);
  const [saveProgress, setSaveProgress] = useState<{ step: string; percent: number } | null>(null);

  // Initial load
  useEffect(() => {
    setData(portfolioData);
  }, [portfolioData]);

  // Cloud diagnostics helper
  const refreshCloudDiagnostics = async () => {
    setCheckingCloudSync(true);
    try {
      const isConn = isSupabaseConnected();
      setIsSupabaseOnline(isConn);
      if (isConn) {
        const [projCheck, tblCheck] = await Promise.all([
          PortfolioService.verifyAllProjectsInSupabase(),
          getSupabaseTablesStatus(),
        ]);
        
        if (projCheck.connected) {
          const syncMap: Record<string, boolean> = {};
          (data.projects || []).forEach((p) => {
            syncMap[p.id] = projCheck.projectIdsInCloud.has(p.id);
          });
          setProjectCloudSyncMap(syncMap);
        }
        
        if (tblCheck.connected && tblCheck.tables) {
          setTablesStatus(tblCheck.tables);
        }
      }
    } catch (err) {
      console.warn('Cloud diagnostics check:', err);
    } finally {
      setCheckingCloudSync(false);
    }
  };

  // Respond to open triggers, tab selections, and direct project add/edit requests
  useEffect(() => {
    if (isOpen) {
      refreshCloudDiagnostics();
      if (initialTab) {
        setActiveTab(initialTab);
      }
      if (initialEditingProject) {
        setIsNewProject(false);
        setEditingProject(initialEditingProject);
      } else if (autoAddProject) {
        setIsNewProject(true);
        setEditingProject({
          id: 'proj-' + Date.now(),
          name: '',
          displayTitle: '',
          title: '',
          slug: '',
          category: 'Full-Stack',
          shortDescription: '',
          longDescription: '',
          fullDescription: '',
          coverImage: '',
          previewImageUrl: '',
          technologies: ['React', 'TypeScript', 'TailwindCSS'],
          githubUrl: '',
          liveDemoUrl: '',
          caseStudyUrl: '',
          status: 'Completed',
          featured: true,
          enabled: true,
          order: (portfolioData.projects?.length || 0) + 1,
          highlights: [],
          files: [],
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }, [isOpen, initialTab, initialEditingProject, autoAddProject, portfolioData.projects]);

  // Auth check
  useEffect(() => {
    AuthService.getCurrentState().then(setAuthState);
    const unsubscribe = AuthService.onAuthStateChange(setAuthState);
    return () => unsubscribe();
  }, []);

  // Fetch messages when inbox tab opened
  useEffect(() => {
    if (activeTab === 'messages' && authState.isAuthenticated) {
      setLoadingMessages(true);
      ContactService.getMessages().then((msgs) => {
        setMessages(msgs);
        setLoadingMessages(false);
      });
    }
    if (activeTab === 'comments' && authState.isAuthenticated) {
      setLoadingComments(true);
      ProjectCommentService.getAllComments().then((cmts) => {
        setAdminComments(cmts);
        setLoadingComments(false);
      });
    }
    if (activeTab === 'projects' || activeTab === 'settings') {
      refreshCloudDiagnostics();
    }
  }, [activeTab, authState.isAuthenticated]);

  const loadAdminComments = async () => {
    setLoadingComments(true);
    const cmts = await ProjectCommentService.getAllComments();
    setAdminComments(cmts);
    setLoadingComments(false);
  };

  const handleUpdateCommentStatus = async (commentId: string, status: CommentStatus) => {
    await ProjectCommentService.updateCommentStatus(commentId, status);
    setAdminComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status } : c)));
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Permanently delete this comment?')) {
      await ProjectCommentService.deleteComment(commentId);
      setAdminComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  // Upload single project directly to Supabase
  const handleUploadProjectDirectly = async (proj: ProjectItem) => {
    setSyncProgressMessage(`Uploading "${proj.title}" to Supabase...`);
    const res = await PortfolioService.saveSingleProject(proj);
    setProjectCloudSyncMap((prev) => ({
      ...prev,
      [proj.id]: res.syncedToSupabase,
    }));
    setSyncProgressMessage(res.message);
    await refreshCloudDiagnostics();
    setTimeout(() => setSyncProgressMessage(null), 3500);
  };

  // Upload all projects to Supabase
  const handleSyncAllProjectsToCloud = async () => {
    if (!data.projects || data.projects.length === 0) return;
    setSyncingAllProjects(true);
    let uploaded = 0;
    for (let i = 0; i < data.projects.length; i++) {
      const proj = data.projects[i];
      setSyncProgressMessage(`Uploading project ${i + 1}/${data.projects.length}: "${proj.title}"...`);
      const res = await PortfolioService.saveSingleProject(proj);
      if (res.syncedToSupabase) {
        uploaded++;
        setProjectCloudSyncMap((prev) => ({ ...prev, [proj.id]: true }));
      }
    }
    setSyncProgressMessage(`Complete! ${uploaded}/${data.projects.length} projects uploaded & verified in Supabase.`);
    await refreshCloudDiagnostics();
    setSyncingAllProjects(false);
    setTimeout(() => setSyncProgressMessage(null), 4000);
  };

  // Delete project from cloud and local
  const handleDeleteProject = async (proj: ProjectItem) => {
    if (confirm(`Permanently delete project "${proj.title}" from Supabase Cloud database and local storage?`)) {
      await ProjectService.deleteProject(proj.id);
      const updatedProjects = data.projects.filter((p) => p.id !== proj.id);
      const updatedData = {
        ...data,
        projects: updatedProjects,
      };
      setData(updatedData);
      onUpdatePortfolioData(updatedData);
      await PortfolioService.savePortfolioData(updatedData);
      setProjectCloudSyncMap((prev) => {
        const next = { ...prev };
        delete next[proj.id];
        return next;
      });
      await refreshCloudDiagnostics();
    }
  };

  // Save project inside modal with real-time feedback
  const handleSaveSingleProject = async () => {
    if (!editingProject) return;
    if (!editingProject.title.trim()) {
      alert('Please provide a project title.');
      return;
    }

    setIsSaving(true);
    setProjectSaveProgress({ step: 'Preparing project repository...', percent: 20 });

    try {
      const res = await PortfolioService.saveSingleProject(editingProject, (step, percent) => {
        setProjectSaveProgress({ step, percent });
      });

      // Update local state
      const exists = data.projects.some((p) => p.id === editingProject.id);
      const updatedProjects = exists
        ? data.projects.map((p) => (p.id === editingProject.id ? editingProject : p))
        : [...data.projects, editingProject];
      const updatedData = {
        ...data,
        projects: updatedProjects,
      };
      setData(updatedData);
      onUpdatePortfolioData(updatedData);

      setProjectCloudSyncMap((prev) => ({
        ...prev,
        [editingProject.id]: res.syncedToSupabase,
      }));

      setProjectSaveProgress({
        step: res.message,
        percent: 100,
        isError: !res.success,
      });

      await refreshCloudDiagnostics();

      setTimeout(() => {
        setProjectSaveProgress(null);
        setIsSaving(false);
        setEditingProject(null);
      }, 1200);
    } catch (err: any) {
      console.error('Error saving project:', err);
      setProjectSaveProgress({
        step: `Error: ${err?.message || 'Save failed'}`,
        percent: 100,
        isError: true,
      });
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const res = await AuthService.signIn(loginEmail, loginPassword);
    if (res.success) {
      const state = await AuthService.getCurrentState();
      setAuthState(state);
    } else {
      setAuthError(res.error || 'Invalid credentials');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await AuthService.signOut();
    const state = await AuthService.getCurrentState();
    setAuthState(state);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setDetailedSaveResult(null);
    setSaveProgress({ step: 'Starting database synchronization...', percent: 10 });
    try {
      const result = await PortfolioService.savePortfolioDataDetailed(data, (step, percent) => {
        setSaveProgress({ step, percent });
      });
      setDetailedSaveResult(result);
      onUpdatePortfolioData(data);
      setSaveSuccess(true);
      await refreshCloudDiagnostics();
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveProgress(null);
      }, 4000);
    } catch (e: any) {
      console.error('Save error:', e);
      setSaveProgress({ step: `Error: ${e?.message || 'Save failed'}`, percent: 100 });
    } finally {
      setIsSaving(false);
    }
  };

  // Upload Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const res = await StorageService.uploadFile(file, 'avatars');
    if (res.url) {
      const updatedData = {
        ...data,
        personal: { ...data.personal, profileImage: res.url },
      };
      setData(updatedData);
      onUpdatePortfolioData(updatedData);
      PortfolioService.savePortfolioData(updatedData);
      PortfolioService.updateProfileImageDirectly(res.url);
    } else {
      alert(res.error || 'Failed to upload image');
    }
    setUploadingImage(false);
  };

  // Upload Resume
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const res = await StorageService.uploadFile(file, 'resumes');
    if (res.url) {
      setData((prev) => ({
        ...prev,
        personal: { ...prev.personal, resumeUrl: res.url },
        heroButtons: {
          ...prev.heroButtons,
          secondary: {
            ...prev.heroButtons.secondary,
            link: res.url,
            enabled: true,
          },
        },
      }));
    } else {
      alert(res.error || 'Failed to upload resume file');
    }
    setUploadingImage(false);
  };

  // Upload Project Cover
  const handleProjectCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProject) return;

    setUploadingImage(true);
    const res = await ProjectService.uploadPreviewImage(editingProject.id, file);
    if (res.url) {
      setEditingProject((prev) => prev ? { 
        ...prev, 
        coverImage: res.url!,
        previewImagePath: res.storagePath,
        previewImageUrl: res.url
      } : null);
    } else {
      alert(res.error || 'Failed to upload project cover');
    }
    setUploadingImage(false);
  };

  // Upload Project Files
  const handleProjectFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProject) return;

    setUploadingFiles(true);
    const newProjectFiles: ProjectFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const res = await ProjectFileService.uploadProjectFile(editingProject.id, file);
      if (res.success && res.projectFile) {
        newProjectFiles.push(res.projectFile);
      } else {
        alert(`Failed to upload ${file.name}: ${res.error}`);
      }
    }

    if (newProjectFiles.length > 0) {
      setEditingProject((prev) => {
        if (!prev) return null;
        const currentFiles = prev.files || [];
        return {
          ...prev,
          files: [...currentFiles, ...newProjectFiles],
        };
      });
    }

    setUploadingFiles(false);
    e.target.value = '';
  };

  // Delete a Project File
  const handleDeleteProjectFile = async (fileToDelete: ProjectFile) => {
    if (!editingProject) return;
    if (confirm(`Remove file "${fileToDelete.fileName}"?`)) {
      await ProjectFileService.deleteProjectFile(fileToDelete);
      setEditingProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          files: (prev.files || []).filter((f) => f.id !== fileToDelete.id),
        };
      });
    }
  };

  // Generate Project ZIP Archive
  const handleGenerateZip = async () => {
    if (!editingProject) return;
    const files = editingProject.files || [];
    if (files.length === 0) {
      alert('Please upload at least one project file before generating an archive.');
      return;
    }

    setGeneratingZip(true);
    setZipProgressStatus('Compiling project files...');

    const res = await ProjectArchiveService.generateProjectZip(
      editingProject,
      files,
      (percent, status) => {
        setZipProgressStatus(`${status} (${percent}%)`);
      }
    );

    if (res.success && res.zipFileName) {
      setEditingProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          zipFileName: res.zipFileName,
          zipFileSize: res.zipFileSize,
          zipStoragePath: res.zipStoragePath,
          zipUpdatedAt: new Date().toISOString(),
        };
      });
      alert(`ZIP Archive successfully generated!\nSize: ${formatFileSize(res.zipFileSize || 0)}`);
    } else {
      alert(res.error || 'Failed to generate ZIP archive');
    }

    setGeneratingZip(false);
    setZipProgressStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl h-[92vh] bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111522] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Portfolio Admin Dashboard
                </h2>
                {isSupabaseConfigured ? (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Supabase Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Local Sync Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Production Content Management & Database Controller
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authState.isAuthenticated && (
              <>
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saveSuccess ? 'Saved to DB!' : isSaving ? 'Saving...' : 'Save & Publish'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              aria-label="Close admin dashboard"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Global Sync Progress Bar */}
        {saveProgress && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300 shrink-0">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>{saveProgress.step}</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">{saveProgress.percent}%</span>
          </div>
        )}
        {detailedSaveResult && !saveProgress && (
          <div className={`px-6 py-2 border-b flex items-center justify-between text-xs shrink-0 ${detailedSaveResult.supabaseStatus?.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'}`}>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {detailedSaveResult.supabaseStatus?.success 
                ? 'All portfolio data and real projects uploaded & verified in Supabase cloud!' 
                : 'All changes saved reliably to browser database.'}
            </span>
            <span className="text-[10px] text-slate-400">
              {detailedSaveResult.projectsSavedCount} projects synced
            </span>
          </div>
        )}

        {/* Auth Guard Screen */}
        {(!authState.isAuthenticated && !ENABLE_ADMIN_MODE) ? (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-md p-8 rounded-2xl bg-[#111522] border border-white/10 shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Admin Authentication</h3>
                <p className="text-xs text-slate-400">
                  {isSupabaseConfigured 
                    ? 'Enter your Supabase Admin email and password to manage real portfolio data.'
                    : 'Enter authorized administrator credentials to manage portfolio data and content.'}
                </p>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@portfolio.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Sign In to Admin</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Admin Management Layout */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-60 bg-[#090b12] border-r border-white/5 p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'profile' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <User className="w-4 h-4" />
                <span>Profile & Bio</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'projects' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Projects ({data.projects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'documents' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <FileText className="w-4 h-4" />
                <span>Public Documents</span>
              </button>

              <button
                onClick={() => setActiveTab('skills')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'skills' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Skills & Tech ({data.skills.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'services' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Services ({data.services.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'social' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Share2 className="w-4 h-4" />
                <span>Social Profiles</span>
              </button>

              <div className="pt-2 border-t border-white/5 hidden md:block" />

              <button
                onClick={() => setActiveTab('experience')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'experience' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Experience ({data.experience.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('education')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'education' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Education ({data.education.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('research')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'research' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Research & Papers ({data.research.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'achievements' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Trophy className="w-4 h-4" />
                <span>Achievements ({data.achievements.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('navigation')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'navigation' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Compass className="w-4 h-4" />
                <span>Navigation Menu ({data.navigation.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('sectionHeaders')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'sectionHeaders' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Heading className="w-4 h-4" />
                <span>Section Titles</span>
              </button>

              <button
                onClick={() => setActiveTab('contactFooter')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'contactFooter' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Contact & Footer</span>
              </button>

              <div className="pt-2 border-t border-white/5 hidden md:block" />

              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'comments' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comments & Reviews</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'messages' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Mail className="w-4 h-4" />
                <span>Messages Inbox</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'database' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Database className="w-4 h-4" />
                <span>Database & Cloud Sync</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 text-left ${activeTab === 'settings' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <Sliders className="w-4 h-4" />
                <span>Site & 3D Settings</span>
              </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#0d101a]">
              
              {/* TAB 1: PROFILE & BIO */}
              {activeTab === 'profile' && (
                <div className="max-w-3xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Personal & Bio Information</h3>
                    <p className="text-xs text-slate-400">Manage your real headline, bio description, availability status, and resume.</p>
                  </div>

                  {/* Profile & Resume Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#121624] border border-white/5">
                    {/* Avatar Upload & URL */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Profile Avatar & Visual
                      </label>
                      <div className="flex items-start gap-4">
                        <img
                          src={data.personal.profileImage}
                          alt="Profile preview"
                          className="w-16 h-16 rounded-2xl object-cover object-top border border-emerald-500/30 bg-[#0a0d14] shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/profile.jpg';
                          }}
                        />
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{uploadingImage ? 'Optimizing...' : 'Upload Image File'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  handleAvatarUpload(e);
                                  e.target.value = '';
                                }}
                                className="hidden"
                              />
                            </label>
                            
                            <button
                              type="button"
                              onClick={() => {
                                setData(prev => ({
                                  ...prev,
                                  personal: { ...prev.personal, profileImage: '/assets/images/profile.jpg' }
                                }));
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-400 hover:text-white transition-colors"
                            >
                              Reset
                            </button>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={data.personal.profileImage}
                              onChange={(e) => {
                                const val = e.target.value;
                                setData(prev => ({
                                  ...prev,
                                  personal: { ...prev.personal, profileImage: val }
                                }));
                              }}
                              placeholder="Or paste direct image URL (https://...)"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500">Supports file uploads (PNG, JPG, WebP) and external URLs</p>
                        </div>
                      </div>
                    </div>

                    {/* Resume / CV Upload */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Resume / CV Document
                      </label>
                      <div className="space-y-2">
                        {data.personal.resumeUrl ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-400 truncate max-w-[180px]">
                              Active: {data.personal.resumeUrl}
                            </span>
                            <button
                              onClick={() => {
                                setData((prev) => ({
                                  ...prev,
                                  personal: { ...prev.personal, resumeUrl: '' },
                                  heroButtons: {
                                    ...prev.heroButtons,
                                    secondary: { ...prev.heroButtons.secondary, enabled: false, link: '' },
                                  },
                                }));
                              }}
                              className="text-xs text-red-400 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No resume attached (Download CV button is hidden).</p>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Real CV (PDF)</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={data.personal.firstName}
                        onChange={(e) => setData({
                          ...data,
                          personal: {
                            ...data.personal,
                            firstName: e.target.value,
                            name: `${e.target.value} ${data.personal.lastName.replace(/\.$/, '')}`,
                          },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Last Name (with accent dot)
                      </label>
                      <input
                        type="text"
                        value={data.personal.lastName}
                        onChange={(e) => setData({
                          ...data,
                          personal: {
                            ...data.personal,
                            lastName: e.target.value,
                            name: `${data.personal.firstName} ${e.target.value.replace(/\.$/, '')}`,
                          },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={data.personal.title}
                      onChange={(e) => setData({
                        ...data,
                        personal: { ...data.personal, title: e.target.value },
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Hero Short Description
                    </label>
                    <textarea
                      rows={3}
                      value={data.personal.shortDescription}
                      onChange={(e) => setData({
                        ...data,
                        personal: { ...data.personal, shortDescription: e.target.value },
                      })}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Availability Status Text
                      </label>
                      <input
                        type="text"
                        value={data.personal.availabilityText}
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, availabilityText: e.target.value },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="is-available-toggle"
                        checked={data.personal.isAvailable}
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, isAvailable: e.target.checked },
                        })}
                        className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-[#121624] border-white/10"
                      />
                      <label htmlFor="is-available-toggle" className="text-sm font-medium text-slate-200">
                        Show green glowing availability badge
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={data.personal.email}
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, email: e.target.value },
                          contact: { ...data.contact, email: e.target.value },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Location / Timezone
                      </label>
                      <input
                        type="text"
                        value={data.personal.location || ''}
                        placeholder="e.g. Chennai, Tamil Nadu, India"
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, location: e.target.value },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={data.personal.phone || ''}
                        placeholder="+91..."
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, phone: e.target.value },
                          contact: { ...data.contact, phone: e.target.value },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={data.personal.city || ''}
                        placeholder="Chennai"
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, city: e.target.value },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        State / Region
                      </label>
                      <input
                        type="text"
                        value={data.personal.state || ''}
                        placeholder="Tamil Nadu"
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, state: e.target.value },
                        })}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#121624] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* University & Degree Quick Overview (Rendered in About Section) */}
                  <div className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      University & Academic Foundations (About Me Overview)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">College / University</label>
                        <input
                          type="text"
                          value={data.personal.college || ''}
                          placeholder="e.g. Vellore Institute of Technology (VIT), Chennai"
                          onChange={(e) => setData({
                            ...data,
                            personal: { ...data.personal, college: e.target.value },
                          })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Semester / Year</label>
                        <input
                          type="text"
                          value={data.personal.semester || ''}
                          placeholder="e.g. Semester 3 (2nd Year)"
                          onChange={(e) => setData({
                            ...data,
                            personal: { ...data.personal, semester: e.target.value },
                          })}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Degree Title</label>
                      <input
                        type="text"
                        value={data.personal.degree || ''}
                        placeholder="e.g. B.Tech — CSE (Computer Science & Engineering) Core"
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, degree: e.target.value },
                        })}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* About Section Story & Quote */}
                  <div className="space-y-4 p-4 rounded-xl bg-[#121624] border border-white/5">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      About Section Story & Mindset
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Hero Quote / Punchline Headline
                      </label>
                      <input
                        type="text"
                        value={data.personal.aboutIntro || ''}
                        placeholder="I like building technologies and fitness..."
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, aboutIntro: e.target.value },
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Detailed Bio / Personal Journey Paragraph
                      </label>
                      <textarea
                        rows={4}
                        value={data.personal.longDescription || ''}
                        placeholder="Share your background, academic journey, focus areas, and technical philosophy..."
                        onChange={(e) => setData({
                          ...data,
                          personal: { ...data.personal, longDescription: e.target.value },
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 resize-y"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Core Focus Areas (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={(data.personal.professionalAt || []).join(', ')}
                          placeholder="Fullstack Architecture, AI & ML Systems..."
                          onChange={(e) => setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              professionalAt: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            },
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Hobbies & Outside Interests (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={(data.personal.hobbies || []).join(', ')}
                          placeholder="Fitness & Strength Training, Open Source..."
                          onChange={(e) => setData({
                            ...data,
                            personal: {
                              ...data.personal,
                              hobbies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            },
                          })}
                          className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hero Call To Action Buttons */}
                  <div className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Hero Call-To-Action (CTA) Buttons
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Primary CTA */}
                      <div className="p-3 rounded-lg bg-[#171c2d] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Primary Button</span>
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.heroButtons.primary.enabled}
                              onChange={(e) => setData({
                                ...data,
                                heroButtons: {
                                  ...data.heroButtons,
                                  primary: { ...data.heroButtons.primary, enabled: e.target.checked },
                                },
                              })}
                              className="w-3.5 h-3.5 rounded text-emerald-500"
                            />
                            <span>Enabled</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Button Text</label>
                          <input
                            type="text"
                            value={data.heroButtons.primary.text}
                            onChange={(e) => setData({
                              ...data,
                              heroButtons: {
                                ...data.heroButtons,
                                primary: { ...data.heroButtons.primary, text: e.target.value },
                              },
                            })}
                            className="w-full px-2.5 py-1.5 rounded bg-[#101420] border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Target Link</label>
                          <input
                            type="text"
                            value={data.heroButtons.primary.link}
                            onChange={(e) => setData({
                              ...data,
                              heroButtons: {
                                ...data.heroButtons,
                                primary: { ...data.heroButtons.primary, link: e.target.value },
                              },
                            })}
                            className="w-full px-2.5 py-1.5 rounded bg-[#101420] border border-white/10 text-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Secondary CTA */}
                      <div className="p-3 rounded-lg bg-[#171c2d] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Secondary Button (Resume)</span>
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={data.heroButtons.secondary.enabled}
                              onChange={(e) => setData({
                                ...data,
                                heroButtons: {
                                  ...data.heroButtons,
                                  secondary: { ...data.heroButtons.secondary, enabled: e.target.checked },
                                },
                              })}
                              className="w-3.5 h-3.5 rounded text-emerald-500"
                            />
                            <span>Enabled</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Button Text</label>
                          <input
                            type="text"
                            value={data.heroButtons.secondary.text}
                            onChange={(e) => setData({
                              ...data,
                              heroButtons: {
                                ...data.heroButtons,
                                secondary: { ...data.heroButtons.secondary, text: e.target.value },
                              },
                            })}
                            className="w-full px-2.5 py-1.5 rounded bg-[#101420] border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Target Link (or leave resume file attached above)</label>
                          <input
                            type="text"
                            value={data.heroButtons.secondary.link}
                            onChange={(e) => setData({
                              ...data,
                              heroButtons: {
                                ...data.heroButtons,
                                secondary: { ...data.heroButtons.secondary, link: e.target.value },
                              },
                            })}
                            className="w-full px-2.5 py-1.5 rounded bg-[#101420] border border-white/10 text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROJECTS MANAGEMENT */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  {/* Top Bar with Realtime Status & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#121624] border border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white tracking-tight">Real Projects Showcase</h3>
                        {isSupabaseConfigured ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Supabase Cloud Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                            Local IndexedDB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {data.projects.length} total projects &bull; {Object.values(projectCloudSyncMap).filter(Boolean).length} verified in Supabase &lsquo;projects&rsquo; table
                      </p>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        onClick={refreshCloudDiagnostics}
                        disabled={checkingCloudSync}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-colors disabled:opacity-50"
                        title="Re-query Supabase database to verify which projects are physically present"
                      >
                        {checkingCloudSync ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Database className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>Verify Cloud</span>
                      </button>

                      {data.projects.length > 0 && (
                        <button
                          onClick={handleSyncAllProjectsToCloud}
                          disabled={syncingAllProjects}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors disabled:opacity-50"
                          title="Upload all projects and project files to Supabase cloud database"
                        >
                          {syncingAllProjects ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>Upload All to Cloud</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsNewProject(true);
                          setEditingProject({
                            id: 'proj-' + Date.now(),
                            name: '',
                            displayTitle: '',
                            title: '',
                            slug: '',
                            category: 'Full-Stack',
                            shortDescription: '',
                            longDescription: '',
                            fullDescription: '',
                            coverImage: '',
                            previewImageUrl: '',
                            technologies: ['React', 'TypeScript', 'TailwindCSS'],
                            githubUrl: '',
                            liveDemoUrl: '',
                            caseStudyUrl: '',
                            status: 'Completed',
                            featured: true,
                            enabled: true,
                            order: data.projects.length + 1,
                            highlights: [],
                            files: [],
                            comments: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Project</span>
                      </button>
                    </div>
                  </div>

                  {/* Sync status toast/banner */}
                  {syncProgressMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 font-medium animate-fadeIn">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
                      <span>{syncProgressMessage}</span>
                    </div>
                  )}

                  {/* Table health diagnostics pills */}
                  {Object.keys(tablesStatus).length > 0 && (
                    <div className="p-3 rounded-xl bg-[#0e121d] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                          Live Supabase Tables Status:
                        </span>
                        <span className="text-[10px] text-slate-500">Real-time counts from cloud</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(tablesStatus).map(([tbl, stat]) => (
                          <div
                            key={tbl}
                            className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border ${
                              stat.exists 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                                : 'bg-red-500/10 border-red-500/20 text-red-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${stat.exists ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="font-mono text-[10px] font-semibold">{tbl}</span>
                            {stat.exists && stat.count !== undefined && (
                              <span className="text-[10px] px-1 py-0.2 bg-white/10 rounded font-bold">
                                {stat.count} rows
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project List */}
                  {data.projects.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-[#121624] border border-white/5 flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                        <FolderGit2 className="w-6 h-6" />
                      </div>
                      <p className="text-base font-bold text-white">No Projects Added Yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed mb-5">
                        All mock projects have been removed. Click below to add and configure your actual project repository, upload code files, link GitHub, and save everything into Supabase.
                      </p>
                      <button
                        onClick={() => {
                          setIsNewProject(true);
                          setEditingProject({
                            id: 'proj-' + Date.now(),
                            name: '',
                            displayTitle: '',
                            title: '',
                            slug: '',
                            category: 'Full-Stack',
                            shortDescription: '',
                            longDescription: '',
                            fullDescription: '',
                            coverImage: '',
                            previewImageUrl: '',
                            technologies: ['React', 'TypeScript', 'TailwindCSS'],
                            githubUrl: '',
                            liveDemoUrl: '',
                            caseStudyUrl: '',
                            status: 'Completed',
                            featured: true,
                            enabled: true,
                            order: 1,
                            highlights: [],
                            files: [],
                            comments: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload Your Real Project</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.projects.map((proj) => {
                        const isVerifiedInCloud = projectCloudSyncMap[proj.id];
                        return (
                          <div key={proj.id} className="p-4 rounded-xl bg-[#121624] border border-white/10 flex flex-col justify-between space-y-3">
                            <div className="flex items-start gap-3">
                              <img
                                src={proj.coverImage || proj.previewImageUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop'}
                                alt={proj.title}
                                className="w-16 h-12 object-cover rounded-lg border border-white/10 shrink-0 bg-slate-900"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-sm font-bold text-white truncate">{proj.title}</h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold shrink-0">
                                    {proj.category}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{proj.shortDescription}</p>
                              </div>
                            </div>

                            {/* Realtime Status Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded ${proj.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                  {proj.enabled ? 'Visible' : 'Hidden'}
                                </span>
                                {proj.featured && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                                    Featured
                                  </span>
                                )}
                                
                                {/* Cloud Sync Verification Badge */}
                                {isVerifiedInCloud ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30" title="Verified present in Supabase 'projects' table">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    Cloud Verified
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30" title="Saved locally in browser; click to upload to Supabase">
                                      <AlertCircle className="w-3 h-3 text-amber-400" />
                                      Local Copy
                                    </span>
                                    <button
                                      onClick={() => handleUploadProjectDirectly(proj)}
                                      className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold border border-emerald-500/30 transition-colors"
                                      title="Upload directly to Supabase now"
                                    >
                                      Upload to Cloud
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setIsNewProject(false);
                                    setEditingProject(proj);
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                  title="Edit project"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(proj)}
                                  className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  title="Delete project from Supabase & local storage"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Project Modal / Edit Form */}
                  {editingProject && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                      <div className="w-full max-w-3xl max-h-[88vh] bg-[#111522] border border-white/10 rounded-2xl p-6 overflow-y-auto space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div>
                            <h4 className="text-base font-bold text-white">
                              {isNewProject ? 'Add Real Project Repository' : `Edit "${editingProject.displayTitle || editingProject.title}"`}
                            </h4>
                            <p className="text-xs text-slate-400">Configure database repository properties, project files, and ZIP download bundle.</p>
                          </div>
                          <button
                            onClick={() => setEditingProject(null)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Display Title</label>
                            <input
                              type="text"
                              required
                              value={editingProject.displayTitle || editingProject.title}
                              onChange={(e) => setEditingProject({ 
                                ...editingProject, 
                                displayTitle: e.target.value,
                                title: e.target.value 
                              })}
                              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                            <input
                              type="text"
                              value={editingProject.category}
                              onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Short Summary</label>
                          <input
                            type="text"
                            value={editingProject.shortDescription}
                            onChange={(e) => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Detailed Description (Modal)</label>
                          <textarea
                            rows={3}
                            value={editingProject.fullDescription || editingProject.longDescription || ''}
                            onChange={(e) => setEditingProject({ 
                              ...editingProject, 
                              longDescription: e.target.value,
                              fullDescription: e.target.value 
                            })}
                            className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm resize-none"
                          />
                        </div>

                        {/* Cover Image */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Header / Cover Image</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={editingProject.coverImage}
                              onChange={(e) => setEditingProject({ ...editingProject, coverImage: e.target.value })}
                              className="flex-1 px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs"
                            />
                            <label className="cursor-pointer px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
                              <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                              <input type="file" accept="image/*" onChange={handleProjectCoverUpload} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">GitHub Source URL</label>
                            <input
                              type="url"
                              placeholder="https://github.com/..."
                              value={editingProject.githubUrl || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Live Demo URL</label>
                            <input
                              type="url"
                              placeholder="https://..."
                              value={editingProject.liveDemoUrl || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, liveDemoUrl: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                            Technologies (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={editingProject.technologies.join(', ')}
                            onChange={(e) => setEditingProject({
                              ...editingProject,
                              technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                            })}
                            className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-sm"
                          />
                        </div>

                        {/* SECTION: TERMINAL TELEMETRY & BUILD STATUS */}
                        <div className="p-4 rounded-xl bg-[#0a0d14] border border-white/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-wide">
                              Terminal Telemetry & Build Status Strip
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            The terminal status line displayed on the project card (e.g., build status, cluster region, cluster telemetry).
                          </p>
                          <input
                            type="text"
                            value={editingProject.telemetryStatus || ''}
                            placeholder="build: success · cluster: production-west · telemetry: healthy"
                            onChange={(e) => setEditingProject({
                              ...editingProject,
                              telemetryStatus: e.target.value,
                            })}
                            className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                          />
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-mono self-center mr-1">Presets:</span>
                            {[
                              'build: success · cluster: production-west · telemetry: healthy',
                              'build: success · cluster: production-east · telemetry: healthy',
                              'pipeline: verified · cluster: multi-region · latency: 12ms',
                              'deploy: active · cluster: edge-cloud · uptime: 99.99%',
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setEditingProject({ ...editingProject, telemetryStatus: preset })}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 text-[10px] font-mono text-slate-300 hover:text-emerald-300 transition-colors"
                              >
                                {preset.split(' · ')[1] || preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* SECTION: ARCHITECTURE & PERFORMANCE METRICS (3 STATS) */}
                        <div className="p-4 rounded-xl bg-[#0a0d14] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-bold text-white uppercase tracking-wide">
                                Architecture & Performance Metrics (Stats Grid)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentStats = editingProject.highlightStats || [
                                  { label: 'Uptime SLA', value: '99.9%' },
                                  { label: 'Latency P99', value: '< 100ms' },
                                  { label: 'Architecture', value: 'Distributed' },
                                ];
                                setEditingProject({
                                  ...editingProject,
                                  highlightStats: [...currentStats, { label: 'Metric', value: 'Value' }],
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Metric</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Performance benchmarks and metrics displayed directly under the project card visualization.
                          </p>

                          <div className="space-y-2">
                            {(editingProject.highlightStats || [
                              { label: 'Uptime SLA', value: '99.9%' },
                              { label: 'Latency P99', value: '< 100ms' },
                              { label: 'Architecture', value: 'Distributed' },
                            ]).map((stat, sIdx, arr) => (
                              <div key={sIdx} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 border border-white/5 text-xs">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">Label</label>
                                    <input
                                      type="text"
                                      value={stat.label}
                                      onChange={(e) => {
                                        const updated = [...arr];
                                        updated[sIdx] = { ...updated[sIdx], label: e.target.value };
                                        setEditingProject({ ...editingProject, highlightStats: updated });
                                      }}
                                      placeholder="e.g. Uptime SLA"
                                      className="w-full px-2.5 py-1.5 rounded-md bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-0.5">Value</label>
                                    <input
                                      type="text"
                                      value={stat.value}
                                      onChange={(e) => {
                                        const updated = [...arr];
                                        updated[sIdx] = { ...updated[sIdx], value: e.target.value };
                                        setEditingProject({ ...editingProject, highlightStats: updated });
                                      }}
                                      placeholder="e.g. 99.9%"
                                      className="w-full px-2.5 py-1.5 rounded-md bg-[#171c2d] border border-white/10 text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = arr.filter((_, i) => i !== sIdx);
                                    setEditingProject({ ...editingProject, highlightStats: updated });
                                  }}
                                  className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-3"
                                  title="Remove metric"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SECTION: ENGINEERING HIGHLIGHTS & FEATS */}
                        <div className="p-4 rounded-xl bg-[#0a0d14] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Server className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-bold text-white uppercase tracking-wide">
                                Engineering Highlights & Feats (Bullet Points)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const current = editingProject.highlights || [
                                  'Zero-downtime containerized cloud deployment with automated rollbacks',
                                  'High-concurrency event stream processing with deterministic memory footprint',
                                  'Multi-layer security isolation with encrypted secret management',
                                ];
                                setEditingProject({
                                  ...editingProject,
                                  highlights: [...current, ''],
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Bullet</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Key architectural feats and capabilities rendered with green checkmarks in the project card.
                          </p>

                          <div className="space-y-2">
                            {(editingProject.highlights || [
                              'Zero-downtime containerized cloud deployment with automated rollbacks',
                              'High-concurrency event stream processing with deterministic memory footprint',
                              'Multi-layer security isolation with encrypted secret management',
                            ]).map((hl, hlIdx, arr) => (
                              <div key={hlIdx} className="flex items-start gap-2">
                                <span className="text-[10px] font-mono text-emerald-400 font-bold px-1.5 py-1 rounded bg-white/5 border border-white/5 shrink-0 mt-1">
                                  #{hlIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={hl}
                                  onChange={(e) => {
                                    const updated = [...arr];
                                    updated[hlIdx] = e.target.value;
                                    setEditingProject({ ...editingProject, highlights: updated });
                                  }}
                                  placeholder="e.g. Zero-downtime containerized cloud deployment..."
                                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = arr.filter((_, i) => i !== hlIdx);
                                    setEditingProject({ ...editingProject, highlights: updated });
                                  }}
                                  className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0 mt-0.5"
                                  title="Remove highlight"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* SECTION: PROJECT FILES REPOSITORY */}
                        <div className="p-4 rounded-xl bg-[#0a0d14] border border-white/10 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <FileCode className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-white uppercase tracking-wide">
                                  Project Repository Files ({editingProject.files?.length || 0})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">Files available for in-browser preview and inclusion in the ZIP download package.</p>
                            </div>

                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{uploadingFiles ? 'Uploading Files...' : 'Add Files'}</span>
                              <input 
                                type="file" 
                                multiple 
                                onChange={handleProjectFilesUpload}
                                className="hidden" 
                              />
                            </label>
                          </div>

                          {/* Files List */}
                          {(!editingProject.files || editingProject.files.length === 0) ? (
                            <p className="text-xs text-slate-500 italic py-2">No files attached yet. Click 'Add Files' to attach code, documentation, images, or configs.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                              {editingProject.files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <span className="font-mono text-slate-200 truncate">{file.fileName}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold shrink-0">
                                      {file.fileCategory}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      {formatFileSize(file.fileSize)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProjectFile(file)}
                                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                                    title="Delete file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ZIP Generation Block */}
                          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <FolderArchive className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-xs font-semibold text-slate-200">
                                  {editingProject.zipFileName ? `ZIP Package: ${editingProject.zipFileName}` : 'ZIP Archive Not Generated'}
                                </span>
                              </div>
                              {editingProject.zipFileSize && (
                                <span className="text-[10px] text-slate-400">
                                  Archive size: {formatFileSize(editingProject.zipFileSize)}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={handleGenerateZip}
                              disabled={generatingZip || !editingProject.files || editingProject.files.length === 0}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs font-semibold disabled:opacity-40"
                            >
                              {generatingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FolderArchive className="w-3.5 h-3.5" />}
                              <span>{generatingZip ? (zipProgressStatus || 'Building ZIP...') : 'Compile ZIP Archive'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={editingProject.featured}
                              onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-500"
                            />
                            <span>Featured Project</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                            <input
                              type="checkbox"
                              checked={editingProject.enabled}
                              onChange={(e) => setEditingProject({ ...editingProject, enabled: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-500"
                            />
                            <span>Visible on Portfolio</span>
                          </label>
                        </div>

                        {/* Real-time Cloud Save Progress indicator */}
                        {projectSaveProgress && (
                          <div className={`p-3 rounded-xl border space-y-1.5 ${projectSaveProgress.isError ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'}`}>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5">
                                {projectSaveProgress.isError ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                ) : projectSaveProgress.percent === 100 ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                                )}
                                {projectSaveProgress.step}
                              </span>
                              <span className="font-mono">{projectSaveProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${projectSaveProgress.isError ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${projectSaveProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="text-[11px] text-slate-400">
                            {isSupabaseConnected() ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Live upload to Supabase cloud table &lsquo;projects&rsquo; enabled
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Saving locally to browser database
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => setEditingProject(null)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={handleSaveSingleProject}
                              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95 disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              <span>{isSaving ? 'Uploading to Supabase...' : 'Save & Upload Project'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: PUBLIC DOCUMENTS */}
              {activeTab === 'documents' && (
                <AdminDocumentManager adminEmail={authState.user?.email || undefined} />
              )}

              {/* TAB 3: SKILLS */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Skills & Tech Stack</h3>
                      <p className="text-xs text-slate-400">Manage real technology chips displayed in the 3D-styled skill cloud.</p>
                    </div>

                    <button
                      onClick={() => {
                        const newSkill: SkillItem = {
                          id: 'sk-' + Date.now(),
                          name: 'New Skill',
                          category: 'frontend',
                          color: '#38bdf8',
                          enabled: true,
                          order: data.skills.length + 1,
                        };
                        setData({ ...data, skills: [...data.skills, newSkill] });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Skill</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.skills.map((skill, idx) => (
                      <div key={skill.id} className="p-3.5 rounded-xl bg-[#121624] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) => {
                              const updated = data.skills.map((s) => s.id === skill.id ? { ...s, name: e.target.value } : s);
                              setData({ ...data, skills: updated });
                            }}
                            className="px-2 py-1 rounded bg-[#171c2d] text-white font-bold text-xs border border-white/5 w-32"
                          />
                          <button
                            onClick={() => {
                              setData({ ...data, skills: data.skills.filter((s) => s.id !== skill.id) });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={skill.category}
                            onChange={(e) => {
                              const updated = data.skills.map((s) => s.id === skill.id ? { ...s, category: e.target.value as any } : s);
                              setData({ ...data, skills: updated });
                            }}
                            className="px-2 py-1 rounded bg-[#171c2d] text-slate-300 text-xs border border-white/5"
                          >
                            <option value="frontend">Frontend</option>
                            <option value="backend">Backend</option>
                            <option value="languages">Languages</option>
                            <option value="devops">DevOps</option>
                            <option value="ai">AI / ML</option>
                            <option value="tools">Tools</option>
                          </select>

                          <input
                            type="color"
                            value={skill.color || '#38bdf8'}
                            onChange={(e) => {
                              const updated = data.skills.map((s) => s.id === skill.id ? { ...s, color: e.target.value } : s);
                              setData({ ...data, skills: updated });
                            }}
                            className="w-7 h-7 rounded border border-white/10 bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SERVICES */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Services Offerings</h3>
                      <p className="text-xs text-slate-400">Configure the 4 core service cards highlighting your offerings.</p>
                    </div>

                    <button
                      onClick={() => {
                        const newSrv: ServiceCardItem = {
                          id: 'srv-' + Date.now(),
                          title: 'New Service',
                          description: 'Service description here...',
                          iconType: 'code',
                          iconColor: '#38bdf8',
                          enabled: true,
                          order: data.services.length + 1,
                        };
                        setData({ ...data, services: [...data.services, newSrv] });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.services.map((srv) => (
                      <div key={srv.id} className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={srv.title}
                            onChange={(e) => {
                              const updated = data.services.map((s) => s.id === srv.id ? { ...s, title: e.target.value } : s);
                              setData({ ...data, services: updated });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#171c2d] text-white font-bold text-sm border border-white/5 flex-1 mr-2"
                          />
                          <button
                            onClick={() => {
                              setData({ ...data, services: data.services.filter((s) => s.id !== srv.id) });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={srv.description}
                          onChange={(e) => {
                            const updated = data.services.map((s) => s.id === srv.id ? { ...s, description: e.target.value } : s);
                            setData({ ...data, services: updated });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#171c2d] text-slate-300 text-xs border border-white/5 resize-none"
                        />

                        <div className="flex items-center gap-3">
                          <select
                            value={srv.iconType}
                            onChange={(e) => {
                              const updated = data.services.map((s) => s.id === srv.id ? { ...s, iconType: e.target.value as any } : s);
                              setData({ ...data, services: updated });
                            }}
                            className="px-2 py-1 rounded bg-[#171c2d] text-slate-300 text-xs border border-white/5"
                          >
                            <option value="code">Code</option>
                            <option value="ui">UI Design</option>
                            <option value="database">Database / API</option>
                            <option value="performance">Performance</option>
                            <option value="ai">AI / ML</option>
                            <option value="cloud">Cloud / DevOps</option>
                            <option value="security">Security</option>
                          </select>

                          <input
                            type="color"
                            value={srv.iconColor || '#38bdf8'}
                            onChange={(e) => {
                              const updated = data.services.map((s) => s.id === srv.id ? { ...s, iconColor: e.target.value } : s);
                              setData({ ...data, services: updated });
                            }}
                            className="w-6 h-6 rounded border border-white/10 bg-transparent cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SOCIAL LINKS */}
              {activeTab === 'social' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Social Profile Circles</h3>
                      <p className="text-xs text-slate-400">Configure round icon badges for GitHub, Gmail, LinkedIn, Instagram, LeetCode, Codeforces, etc.</p>
                    </div>

                    <button
                      onClick={() => {
                        const newSoc: SocialLink = {
                          id: 'soc-' + Date.now(),
                          name: 'Custom',
                          platform: 'custom',
                          url: 'https://',
                          enabled: true,
                          order: data.socialLinks.length + 1,
                        };
                        setData({ ...data, socialLinks: [...data.socialLinks, newSoc] });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {data.socialLinks.map((soc) => (
                      <div key={soc.id} className="p-3.5 rounded-xl bg-[#121624] border border-white/5 flex items-center gap-3">
                        <select
                          value={soc.platform}
                          onChange={(e) => {
                            const updated = data.socialLinks.map((s) => s.id === soc.id ? { ...s, platform: e.target.value as any, name: e.target.value } : s);
                            setData({ ...data, socialLinks: updated });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#171c2d] text-white text-xs border border-white/5 font-semibold"
                        >
                          <option value="github">GitHub</option>
                          <option value="gmail">Gmail</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="instagram">Instagram</option>
                          <option value="codeforces">Codeforces</option>
                          <option value="leetcode">LeetCode</option>
                          <option value="streamlit">Streamlit</option>
                          <option value="huggingface">Hugging Face</option>
                          <option value="twitter">Twitter / X</option>
                          <option value="youtube">YouTube</option>
                          <option value="discord">Discord</option>
                          <option value="custom">Custom</option>
                        </select>

                        <input
                          type="text"
                          value={soc.url}
                          placeholder="https://..."
                          onChange={(e) => {
                            const updated = data.socialLinks.map((s) => s.id === soc.id ? { ...s, url: e.target.value } : s);
                            setData({ ...data, socialLinks: updated });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#171c2d] text-slate-200 text-xs border border-white/5"
                        />

                        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={soc.enabled}
                            onChange={(e) => {
                              const updated = data.socialLinks.map((s) => s.id === soc.id ? { ...s, enabled: e.target.checked } : s);
                              setData({ ...data, socialLinks: updated });
                            }}
                            className="rounded text-emerald-500"
                          />
                          <span>Show</span>
                        </label>

                        <button
                          onClick={() => {
                            setData({ ...data, socialLinks: data.socialLinks.filter((s) => s.id !== soc.id) });
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: COMMENTS MODERATION */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Project Comments Moderation</h3>
                      <p className="text-xs text-slate-400">Review, approve, or reject user feedback and technical reviews across all projects.</p>
                    </div>

                    <button
                      onClick={loadAdminComments}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                    >
                      Refresh
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2">
                    {(['all', 'pending', 'approved', 'rejected', 'spam'] as const).map((filter) => {
                      const count = filter === 'all' 
                        ? adminComments.length 
                        : adminComments.filter((c) => c.status === filter).length;
                      return (
                        <button
                          key={filter}
                          onClick={() => setCommentFilter(filter)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                            commentFilter === filter
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
                          }`}
                        >
                          {filter} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {loadingComments ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                    </div>
                  ) : adminComments.filter((c) => commentFilter === 'all' || c.status === commentFilter).length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5">
                      <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No comments found</p>
                      <p className="text-xs text-slate-500 mt-1">Comments submitted on project repositories will appear here for moderation.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminComments
                        .filter((c) => commentFilter === 'all' || c.status === commentFilter)
                        .map((comment) => {
                          const project = data.projects.find((p) => p.id === comment.projectId);
                          return (
                            <div key={comment.id} className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-3">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-white">{comment.authorName}</span>
                                  {comment.authorEmail && (
                                    <span className="text-xs text-slate-400">({comment.authorEmail})</span>
                                  )}
                                  {project && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                                      Project: {project.displayTitle || project.title}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                    comment.status === 'approved' 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                      : comment.status === 'pending'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : comment.status === 'rejected'
                                      ? 'bg-slate-700 text-slate-400'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    {comment.status}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-200 leading-relaxed bg-[#0a0d14] p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                                {comment.content || comment.comment}
                              </p>

                              {/* Moderation Actions */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {comment.status !== 'approved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCommentStatus(comment.id, 'approved')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 text-xs font-semibold"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                  )}

                                  {comment.status !== 'rejected' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCommentStatus(comment.id, 'rejected')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>
                                  )}

                                  {comment.status !== 'spam' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCommentStatus(comment.id, 'spam')}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Mark Spam</span>
                                    </button>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                  title="Permanently delete comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: MESSAGES INBOX */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Contact Messages Inbox</h3>
                      <p className="text-xs text-slate-400">Incoming inquiries submitted through the portfolio contact form.</p>
                    </div>

                    <button
                      onClick={() => {
                        setLoadingMessages(true);
                        ContactService.getMessages().then((msgs) => {
                          setMessages(msgs);
                          setLoadingMessages(false);
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingMessages ? (
                    <div className="p-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5">
                      <Mail className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-300">No Messages Yet</p>
                      <p className="text-xs text-slate-500 mt-1">When visitors submit inquiries via the contact form, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{msg.name}</span>
                                <span className="text-xs text-slate-400">({msg.email})</span>
                              </div>
                              <div className="text-xs font-semibold text-emerald-400 mt-0.5">{msg.subject || 'Portfolio Inquiry'}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">
                                {new Date(msg.createdAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={async () => {
                                  await ContactService.deleteMessage(msg.id);
                                  setMessages(messages.filter((m) => m.id !== msg.id));
                                }}
                                className="text-red-400 hover:text-red-300 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/5 whitespace-pre-wrap">
                            {msg.message}
                          </p>

                          <div className="pt-2">
                            <a
                              href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Portfolio Inquiry')}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Reply via Email</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: SITE & 3D SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Visual & Section Toggles</h3>
                    <p className="text-xs text-slate-400">Adjust the interactive 3D particle hero effects and toggle optional portfolio sections.</p>
                  </div>

                  {/* Supabase SQL Setup Card */}
                  <div className="p-5 rounded-2xl bg-[#121624] border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Supabase Database Setup Script</h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        supabase_quick_setup.sql
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Need to run the initial tables and storage bucket in your Supabase SQL Editor? Click below to copy the verified, syntax-checked SQL script directly to your clipboard.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch('/supabase_quick_setup.sql');
                            const sqlText = await res.text();
                            await navigator.clipboard.writeText(sqlText);
                            alert('Copied supabase_quick_setup.sql to clipboard! Paste it into Supabase SQL Editor and click Run.');
                          } catch (e) {
                            alert('Please open supabase_quick_setup.sql directly in the project file explorer.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Supabase SQL</span>
                      </button>

                      <a
                        href="/supabase_quick_setup.sql"
                        download="supabase_quick_setup.sql"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .sql File</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Visual & Section Toggles</h4>

                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs font-medium text-slate-200">Enable Interactive 3D Cube Canvas in Hero</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.enable3DEffects}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, enable3DEffects: e.target.checked },
                          })}
                          className="w-4 h-4 rounded text-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-xs font-medium text-slate-200">Show Profile Avatar in Hero 3D System</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showProfileVisual}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showProfileVisual: e.target.checked },
                          })}
                          className="w-4 h-4 rounded text-emerald-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#121624] border border-white/5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Visible Sections Controller</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#171c2d] cursor-pointer">
                        <span className="text-xs text-slate-300">Services Section</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showSectionServices}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showSectionServices: e.target.checked },
                          })}
                          className="rounded text-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#171c2d] cursor-pointer">
                        <span className="text-xs text-slate-300">Skills Section</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showSectionSkills}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showSectionSkills: e.target.checked },
                          })}
                          className="rounded text-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#171c2d] cursor-pointer">
                        <span className="text-xs text-slate-300">Projects Section</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showSectionProjects}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showSectionProjects: e.target.checked },
                          })}
                          className="rounded text-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#171c2d] cursor-pointer">
                        <span className="text-xs text-slate-300">Contact Section</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showSectionContact}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showSectionContact: e.target.checked },
                          })}
                          className="rounded text-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#171c2d] cursor-pointer">
                        <span className="text-xs text-slate-300">Experience Section</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showSectionExperience}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showSectionExperience: e.target.checked },
                          })}
                          className="rounded text-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-[#171c2d] cursor-pointer">
                        <span className="text-xs text-slate-300">Education Section</span>
                        <input
                          type="checkbox"
                          checked={data.visualSettings.showSectionEducation}
                          onChange={(e) => setData({
                            ...data,
                            visualSettings: { ...data.visualSettings, showSectionEducation: e.target.checked },
                          })}
                          className="rounded text-emerald-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: DATABASE & CLOUD SYNC */}
              {activeTab === 'database' && (
                <DatabaseControlCenter
                  portfolioData={data}
                  onUpdatePortfolioData={(updated) => {
                    setData(updated);
                    onUpdatePortfolioData(updated);
                  }}
                />
              )}

              {/* TAB: EXPERIENCE */}
              {activeTab === 'experience' && (
                <AdminExperienceManager
                  experiences={data.experience || []}
                  onChange={(nextExp) => {
                    const nextData = { ...data, experience: nextExp };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

              {/* TAB: EDUCATION */}
              {activeTab === 'education' && (
                <AdminEducationManager
                  education={data.education || []}
                  onChange={(nextEdu) => {
                    const nextData = { ...data, education: nextEdu };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

              {/* TAB: RESEARCH & PAPERS */}
              {activeTab === 'research' && (
                <AdminResearchManager
                  research={data.research || []}
                  onChange={(nextRes) => {
                    const nextData = { ...data, research: nextRes };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

              {/* TAB: ACHIEVEMENTS & AWARDS */}
              {activeTab === 'achievements' && (
                <AdminAchievementsManager
                  achievements={data.achievements || []}
                  onChange={(nextAch) => {
                    const nextData = { ...data, achievements: nextAch };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

              {/* TAB: NAVIGATION MENU */}
              {activeTab === 'navigation' && (
                <AdminNavigationManager
                  navigation={data.navigation || []}
                  onChange={(nextNav) => {
                    const nextData = { ...data, navigation: nextNav };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

              {/* TAB: SECTION TITLES & SUBTITLES */}
              {activeTab === 'sectionHeaders' && (
                <AdminSectionHeadersManager
                  sectionHeaders={data.sectionHeaders}
                  onChange={(nextHeaders) => {
                    const nextData = { ...data, sectionHeaders: nextHeaders };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

              {/* TAB: CONTACT & FOOTER SETTINGS */}
              {activeTab === 'contactFooter' && (
                <AdminContactFooterManager
                  contact={data.contact}
                  footer={data.footer}
                  onChangeContact={(nextContact) => {
                    const nextData = { ...data, contact: nextContact };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                  onChangeFooter={(nextFooter) => {
                    const nextData = { ...data, footer: nextFooter };
                    setData(nextData);
                    onUpdatePortfolioData(nextData);
                  }}
                />
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
