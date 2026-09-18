import React, { useEffect, useRef, useState } from 'react';
import { ProjectItem, ProjectFile } from '../types/portfolio';
import { 
  X, 
  ExternalLink, 
  Github, 
  CheckCircle2, 
  Layers, 
  Download, 
  FileCode, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive, 
  FileCheck, 
  Eye, 
  FolderArchive, 
  Maximize2,
  Edit3,
  Trash2,
  Upload,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { FilePreviewModal } from './project/FilePreviewModal';
import { ImageLightboxModal } from './project/ImageLightboxModal';
import { ProjectCommentsSection } from './project/ProjectCommentsSection';
import { ProjectArchiveService } from '../services/projectArchiveService';
import { ProjectFileService } from '../services/projectFileService';
import { PortfolioService } from '../services/portfolioService';
import { AuthService } from '../services/authService';
import { sanitizeUrl } from '../utils/security';
import { formatFileSize } from '../utils/fileUtils';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onEditProject?: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  onUpdateProject?: (project: ProjectItem) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onEditProject,
  onDeleteProject,
  onUpdateProject,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Local project tracking so updates reflect immediately
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(project);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    AuthService.getCurrentState().then((s) => setIsAdmin(s.isAuthenticated && s.isAdmin));
    const unsubscribe = AuthService.onAuthStateChange((s) => setIsAdmin(s.isAuthenticated && s.isAdmin));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  // Active sub-modals
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // File Upload State
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  const [uploadSuccessAlert, setUploadSuccessAlert] = useState<string | null>(null);
  const [uploadErrorAlert, setUploadErrorAlert] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);
  const [fileToDeleteConfirmId, setFileToDeleteConfirmId] = useState<string | null>(null);

  // Handle escape key and body scroll locking
  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !selectedFile && !lightboxImage) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [project, onClose, selectedFile, lightboxImage]);

  if (!project) return null;

  const activeProject = (currentProject && currentProject.id === project.id) ? currentProject : project;
  const displayTitle = activeProject.displayTitle || activeProject.name || activeProject.title;
  const projectFiles = activeProject.files || [];
  const hasDownloadableZip = Boolean(activeProject.zipStoragePath || (activeProject.zipFileSize && activeProject.zipFileSize > 0));

  const getFileCategoryIcon = (category: string) => {
    switch (category) {
      case 'code': return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'video': return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-pink-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      case 'archive': return <Archive className="w-4 h-4 text-amber-400" />;
      default: return <FileCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleDownloadZip = () => {
    if (activeProject.zipStoragePath) {
      ProjectArchiveService.downloadZipFile(
        activeProject.zipStoragePath,
        activeProject.zipFileName || `${activeProject.slug || 'project'}-source.zip`
      );
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      setUploadErrorAlert('Authorization Error: Only authenticated administrators can upload files.');
      return;
    }
    if (!e.target.files || e.target.files.length === 0 || !activeProject) return;
    const filesToUpload = Array.from(e.target.files);
    setIsUploadingFiles(true);
    setUploadPercent(10);
    setUploadStatusMessage(`Preparing to upload ${filesToUpload.length} file(s) to Supabase Storage...`);
    setUploadErrorAlert(null);
    setUploadSuccessAlert(null);

    const newProjectFiles: ProjectFile[] = [];

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const currentPct = Math.round(15 + (i / filesToUpload.length) * 75);
        setUploadPercent(currentPct);
        setUploadStatusMessage(`Uploading "${file.name}" to Supabase Storage (${i + 1}/${filesToUpload.length})...`);

        const uploadRes = await ProjectFileService.uploadProjectFile(
          activeProject.id,
          file,
          (_pct, status) => {
            setUploadStatusMessage(status);
          }
        );

        if (uploadRes.success && uploadRes.projectFile) {
          newProjectFiles.push(uploadRes.projectFile);
        } else if (uploadRes.error) {
          console.warn(`File ${file.name} upload warning:`, uploadRes.error);
        }
      }

      const existingFiles = activeProject.files || [];
      const updatedFiles = [...existingFiles, ...newProjectFiles];
      const updatedProject: ProjectItem = {
        ...activeProject,
        files: updatedFiles,
      };

      setCurrentProject(updatedProject);
      onUpdateProject?.(updatedProject);
      await PortfolioService.saveSingleProject(updatedProject);

      setUploadPercent(100);
      setUploadStatusMessage('Files uploaded to Supabase successfully!');
      setUploadSuccessAlert(`Successfully uploaded ${newProjectFiles.length} file(s) to Supabase Storage!`);
      setTimeout(() => setUploadSuccessAlert(null), 5000);
    } catch (err: any) {
      console.error('Project file upload error:', err);
      setUploadErrorAlert('Upload error: ' + (err?.message || 'Failed to upload to Supabase storage.'));
    } finally {
      setIsUploadingFiles(false);
      setUploadPercent(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileToDelete: ProjectFile) => {
    if (!isAdmin) {
      setUploadErrorAlert('Authorization Error: Only authenticated administrators can delete files.');
      return;
    }
    if (!activeProject) return;

    if (fileToDeleteConfirmId !== fileToDelete.id) {
      setFileToDeleteConfirmId(fileToDelete.id);
      setTimeout(() => setFileToDeleteConfirmId(null), 4000);
      return;
    }

    try {
      setFileToDeleteConfirmId(null);
      await ProjectFileService.deleteProjectFile(fileToDelete);
      const updatedFiles = (activeProject.files || []).filter((f) => f.id !== fileToDelete.id);
      const updatedProject: ProjectItem = {
        ...activeProject,
        files: updatedFiles,
      };

      setCurrentProject(updatedProject);
      onUpdateProject?.(updatedProject);
      await PortfolioService.saveSingleProject(updatedProject);

      if (selectedFile?.id === fileToDelete.id) {
        setSelectedFile(null);
      }
      setUploadSuccessAlert(`File "${fileToDelete.fileName}" was deleted successfully.`);
      setTimeout(() => setUploadSuccessAlert(null), 3500);
    } catch (err: any) {
      console.error('Failed to delete file from Supabase:', err);
      setUploadErrorAlert('Failed to delete file: ' + (err?.message || 'Unknown error'));
      setTimeout(() => setUploadErrorAlert(null), 4500);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-project-title"
        >
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="card-chiseled relative w-full max-w-3xl rounded-2xl bg-[#080d1a] border border-white/[0.12] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.05] overflow-hidden z-10 my-6 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header Cover Image */}
            <div className="relative w-full h-52 sm:h-72 bg-[#0c1222] overflow-hidden shrink-0 group">
              <img
                src={activeProject.coverImage}
                alt={displayTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-[#080d1a]/40 to-transparent" />

              {/* Lightbox zoom trigger */}
              <button
                onClick={() => setLightboxImage({ url: activeProject.coverImage, title: displayTitle })}
                className="absolute bottom-4 right-4 sm:right-6 px-3 py-1.5 rounded-lg bg-[#07090e]/80 hover:bg-[#07090e] border border-white/15 text-slate-200 text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-colors"
                title="Expand header image"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Zoom Image</span>
              </button>

              {/* Action Buttons in Header */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {/* Delete Project Button (only visible and enabled for authenticated admins) */}
                {isAdmin && onDeleteProject && (
                  <button
                    onClick={() => {
                      if (!confirmDeleteProject) {
                        setConfirmDeleteProject(true);
                        setTimeout(() => setConfirmDeleteProject(false), 4000);
                        return;
                      }
                      onClose();
                      onDeleteProject(activeProject.id);
                    }}
                    className={`px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer backdrop-blur-md ${
                      confirmDeleteProject
                        ? 'bg-red-600 hover:bg-red-700 ring-2 ring-white animate-pulse'
                        : 'bg-red-500/85 hover:bg-red-500'
                    }`}
                    title={confirmDeleteProject ? 'Click again to permanently delete project' : 'Permanently delete this project'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{confirmDeleteProject ? 'Confirm Delete?' : 'Delete Project'}</span>
                  </button>
                )}

                {/* Edit Project Button (only visible and enabled for authenticated admins) */}
                {isAdmin && onEditProject && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditProject(activeProject);
                    }}
                    className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer backdrop-blur-md"
                    title="Open this project in editor"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit Project</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-2 rounded-full bg-[#07090e]/80 border border-white/15 text-slate-300 hover:text-white hover:bg-[#07090e] transition-all duration-200 backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Badge */}
              <div className="absolute bottom-4 left-6">
                <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 backdrop-blur-md">
                  {activeProject.category}
                </span>
              </div>
            </div>

            {/* Modal Scrollable Body Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {/* Title & Descriptions */}
              <div>
                <h2 
                  id="modal-project-title"
                  className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2"
                >
                  {displayTitle}
                </h2>
                <p className="text-base text-slate-300 leading-relaxed">
                  {activeProject.fullDescription || activeProject.longDescription || activeProject.shortDescription}
                </p>
              </div>

              {/* Architecture Highlights if present */}
              {activeProject.highlights && activeProject.highlights.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Key Architecture & Features
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeProject.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technologies */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Technologies & Frameworks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(activeProject.technologies || []).map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#141824] text-slate-200 border border-white/[0.08]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Link Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/[0.08]">
                {activeProject.liveDemoUrl && (
                  <a
                    href={sanitizeUrl(activeProject.liveDemoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-btn-primary text-sm inline-flex items-center gap-2"
                  >
                    <span>View Live Application</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {activeProject.githubUrl && (
                  <a
                    href={sanitizeUrl(activeProject.githubUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-btn-secondary text-sm inline-flex items-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    <span>View GitHub Source</span>
                  </a>
                )}

                {activeProject.caseStudyUrl && (
                  <a
                    href={sanitizeUrl(activeProject.caseStudyUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="portfolio-btn-secondary text-sm inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>Read Case Study</span>
                  </a>
                )}
              </div>

              {/* PROJECT FILES & REPOSITORY SECTION */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Project Files & Assets ({projectFiles.length})
                    </h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingFiles}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Upload files to Supabase Storage"
                      >
                        {isUploadingFiles ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload Files to Supabase</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Progress Bar */}
                {isUploadingFiles && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        {uploadStatusMessage}
                      </span>
                      <span className="text-emerald-400 font-bold">{uploadPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-300"
                        style={{ width: `${uploadPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Alert */}
                {uploadSuccessAlert && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{uploadSuccessAlert}</span>
                  </div>
                )}

                {/* Error Alert */}
                {uploadErrorAlert && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{uploadErrorAlert}</span>
                  </div>
                )}

                {projectFiles.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-xl border border-dashed border-white/15 hover:border-emerald-500/50 bg-[#10141f]/60 hover:bg-[#10141f] text-center cursor-pointer transition-colors space-y-2"
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      No files attached to this project yet.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Click here or use the upload button above to upload code, documents, or data files directly to Supabase Storage.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {projectFiles.map((file) => (
                      <div
                        key={file.id}
                        className="group flex items-center justify-between p-3 rounded-xl bg-[#10141f] hover:bg-[#151b2a] border border-white/5 hover:border-white/15 transition-all duration-200"
                      >
                        <div
                          onClick={() => setSelectedFile(file)}
                          className="flex items-center gap-3 min-w-0 pr-2 flex-1 cursor-pointer"
                        >
                          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 shrink-0 transition-colors">
                            {getFileCategoryIcon(file.fileCategory)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate transition-colors">
                              {file.fileName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span>{formatFileSize(file.fileSize)}</span>
                              {file.storagePath?.includes('supabase') || !file.storagePath?.startsWith('inline/') ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                  Supabase
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedFile(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {file.publicUrl && (
                            <a
                              href={sanitizeUrl(file.publicUrl)}
                              download={file.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                fileToDeleteConfirmId === file.id
                                  ? 'bg-red-500 text-white animate-pulse'
                                  : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                              }`}
                              title={fileToDeleteConfirmId === file.id ? 'Click again to confirm delete' : 'Delete file from Supabase'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DOWNLOAD PROJECT ZIP BUTTON */}
              {hasDownloadableZip && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/30 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <FolderArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Project Source Archive Available</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Download the complete project package ({activeProject.zipFileSize ? formatFileSize(activeProject.zipFileSize) : 'Verified ZIP'})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadZip}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 shrink-0 w-full sm:w-auto justify-center cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Project ZIP</span>
                  </button>
                </div>
              )}

              {/* COMMENTS SECTION */}
              <ProjectCommentsSection 
                projectId={activeProject.id} 
                initialComments={activeProject.comments}
              />
            </div>

          </motion.div>
        </div>
      </AnimatePresence>

      {/* Sub-Modal: File Previewer */}
      {selectedFile && (
        <FilePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onOpenLightbox={(url, title) => setLightboxImage({ url, title: title || selectedFile.fileName })}
          onDeleteFile={handleDeleteFile}
        />
      )}

      {/* Sub-Modal: Image Lightbox */}
      {lightboxImage && (
        <ImageLightboxModal
          imageUrl={lightboxImage.url}
          title={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
};
