import React, { useRef, useState } from 'react';
import { ProjectItem } from '../types/portfolio';
import { 
  ExternalLink, 
  Github, 
  ArrowUpRight, 
  Edit3, 
  Trash2, 
  Layers, 
  Globe, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Maximize2,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  Terminal,
  Server
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { sanitizeUrl } from '../utils/security';
import { EditHighlightsModal, EditMetricsModal, EditTelemetryModal } from './project/ProjectSectionQuickEditors';
import { PortfolioService } from '../services/portfolioService';

interface ProjectCardProps {
  project: ProjectItem;
  enable3D?: boolean;
  onOpenDetails: (project: ProjectItem) => void;
  onEdit?: (project: ProjectItem) => void;
  onDelete?: (projectId: string) => void;
  onUpdateProject?: (project: ProjectItem) => void;
  layoutMode?: 'showcase' | 'grid';
  index?: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  enable3D = true,
  onOpenDetails,
  onEdit,
  onDelete,
  onUpdateProject,
  layoutMode = 'showcase',
  index = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const is3DActive = enable3D && !shouldReduceMotion && layoutMode === 'grid';
  const [activeTab, setActiveTab] = useState<'overview' | 'highlights' | 'metrics'>('overview');

  // Quick edit modal states
  const [isEditingHighlights, setIsEditingHighlights] = useState(false);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [isEditingTelemetry, setIsEditingTelemetry] = useState(false);

  const handleSaveHighlights = (newHighlights: string[]) => {
    const updated = { ...project, highlights: newHighlights };
    PortfolioService.saveSingleProject(updated).catch((err) => console.warn('Cloud save warning:', err));
    onUpdateProject?.(updated);
  };

  const handleSaveMetrics = (newStats: { label: string; value: string }[]) => {
    const updated = { ...project, highlightStats: newStats };
    PortfolioService.saveSingleProject(updated).catch((err) => console.warn('Cloud save warning:', err));
    onUpdateProject?.(updated);
  };

  const handleSaveTelemetry = (newTelemetry: string) => {
    const updated = { ...project, telemetryStatus: newTelemetry };
    PortfolioService.saveSingleProject(updated).catch((err) => console.warn('Cloud save warning:', err));
    onUpdateProject?.(updated);
  };

  const renderQuickModals = () => (
    <>
      <EditHighlightsModal
        isOpen={isEditingHighlights}
        onClose={() => setIsEditingHighlights(false)}
        projectTitle={displayTitle}
        initialHighlights={project.highlights}
        onSave={handleSaveHighlights}
      />
      <EditMetricsModal
        isOpen={isEditingMetrics}
        onClose={() => setIsEditingMetrics(false)}
        projectTitle={displayTitle}
        initialStats={project.highlightStats}
        onSave={handleSaveMetrics}
      />
      <EditTelemetryModal
        isOpen={isEditingTelemetry}
        onClose={() => setIsEditingTelemetry(false)}
        projectTitle={displayTitle}
        initialTelemetry={project.telemetryStatus}
        onSave={handleSaveTelemetry}
      />
    </>
  );

  // 3D tilt springs (for subtle tactile response on pointer move)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 24, stiffness: 140, mass: 0.35 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [2.2, -2.2]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-2.2, 2.2]);

  const handlePointerEnter = () => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (!rectRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
    }
    const rect = rectRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);

    if (is3DActive) {
      mouseX.set(x / (rect.width || 1) - 0.5);
      mouseY.set(y / (rect.height || 1) - 0.5);
    }
  };

  const handlePointerLeave = () => {
    rectRef.current = null;
    if (is3DActive) {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  const displayTitle = project.displayTitle || project.name || project.title;
  const isEven = index % 2 === 0;
  const formattedIndex = String(index + 1).padStart(2, '0');

  // Realistic domain display
  const getDomainDisplay = () => {
    if (project.liveDemoUrl && !project.liveDemoUrl.startsWith('#')) {
      try {
        const url = new URL(project.liveDemoUrl);
        return url.hostname + url.pathname;
      } catch {
        return project.liveDemoUrl.replace(/^https?:\/\//, '');
      }
    }
    if (project.githubUrl) {
      return project.githubUrl.replace('https://github.com/', 'github.com/');
    }
    return `production.piyush.dev/${project.id}`;
  };

  const statusLabel = project.status || (project.liveDemoUrl ? 'Live Production' : 'Open Source System');

  // Fallback production stats for systems lacking custom stats
  const resolvedStats = project.highlightStats && project.highlightStats.length > 0
    ? project.highlightStats
    : [
        { label: 'Uptime SLA', value: '99.9%' },
        { label: 'Latency P99', value: '< 100ms' },
        { label: 'Architecture', value: 'Distributed' },
      ];

  // --- SHOWCASE MODE: Grand Full-Width Architectural Case Study Layout ---
  if (layoutMode === 'showcase') {
    return (
      <div
        ref={cardRef}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="group card-chiseled relative rounded-3xl bg-[#080d1a]/95 border border-white/[0.08] hover:border-emerald-500/35 transition-all duration-500 hover:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)] overflow-hidden p-6 sm:p-10 lg:p-12 xl:p-14"
      >
        {/* Subtle Ambient Radial Glow on pointer hover */}
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10"
          style={{
            background: `radial-gradient(750px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 242, 150, 0.08), transparent 70%)`,
          }}
        />

        {/* Top subtle hover accent gradient bar */}
        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />

        {/* TOP SYSTEM CLASSIFICATION HEADER */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-white/[0.08]">
          {/* Index & System Tag */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM {formattedIndex} // PRODUCTION
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400">
              {project.date || '2025 - Present'}
            </span>
          </div>

          {/* Quick Telemetry & Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0f1728] text-slate-200 border border-white/[0.08]">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{statusLabel}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0f1728] text-cyan-300 border border-cyan-500/25">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enterprise Ready</span>
            </span>
          </div>
        </div>

        {/* MAIN TWO-COLUMN GRAND SHOWCASE GRID */}
        <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-start">
          
          {/* VISUAL HALF: High-Fidelity Browser & Terminal Mockup (7 Columns) */}
          <div className={`lg:col-span-7 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
            <div 
              onClick={() => onOpenDetails(project)}
              className="relative rounded-2xl overflow-hidden bg-[#0a0f1d] border border-white/[0.1] hover:border-emerald-500/40 shadow-2xl transition-all duration-300 cursor-pointer group/frame"
            >
              {/* Sleek Browser Window Header Chrome */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0d1424] border-b border-white/[0.08]">
                {/* Traffic Light Window Dots */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/30" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/30" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/30" />
                </div>

                {/* Simulated TLS Domain Bar */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#080d1a] border border-white/[0.08] text-[11px] font-mono text-slate-300 max-w-[280px] sm:max-w-sm truncate shadow-inner">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{getDomainDisplay()}</span>
                </div>

                {/* Latency badge & Enlarge Action */}
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                    <Zap className="w-3 h-3" />
                    <span>14ms</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(project);
                    }}
                    title="Expand Project Architecture"
                    className="p-1 hover:text-white transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* High-Resolution Project Showcase Imagery */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#0d131f]">
                <img
                  src={project.coverImage}
                  alt={displayTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center filter brightness-[0.94] contrast-[1.04] group-hover/frame:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Subtle depth vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101724]/90 via-transparent to-transparent pointer-events-none" />

                {/* Category Pill on bottom-left */}
                <div className="absolute bottom-4 left-4 z-20">
                  <span className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#121a28]/95 text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-xl">
                    {project.category}
                  </span>
                </div>

                {/* View Architecture Case Study Overlay Chip on bottom-right */}
                <div className="absolute bottom-4 right-4 z-20">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 shadow-lg backdrop-blur-md transition-colors">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Deep Architecture</span>
                  </span>
                </div>
              </div>

              {/* Quick Terminal Status Footer Strip */}
              <div className="px-4 py-2.5 bg-[#0e1420] border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 truncate">
                  <Terminal className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">{project.telemetryStatus || 'build: success · cluster: production-west · telemetry: healthy'}</span>
                </span>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTelemetry(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                    title="Edit Telemetry Status"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <span className="hidden sm:inline text-slate-400 font-medium">Click to inspect</span>
                </div>
              </div>
            </div>

            {/* Architecture Metrics Grid (Under Image for prominent weight) */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  Architecture & SLA Metrics
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingMetrics(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                  title="Edit Architecture Metrics"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {resolvedStats.map((stat, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[#080d1a] border border-white/[0.08] hover:border-emerald-500/35 transition-all shadow-inner"
                  >
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      {stat.label}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-white">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EDITORIAL & SPECIFICATIONS HALF (5 Columns) */}
          <div className={`lg:col-span-5 flex flex-col justify-between h-full ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
            <div>
              {/* Category Eyebrow */}
              <div className="flex items-center gap-2 mb-2.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">
                  {project.category}
                </span>
              </div>

              {/* Grand Project Title */}
              <h3
                onClick={() => onOpenDetails(project)}
                className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition-colors cursor-pointer mb-4 leading-tight"
              >
                {displayTitle}
              </h3>

              {/* Comprehensive Executive Description */}
              <p className="text-base text-slate-300 leading-relaxed font-normal mb-6">
                {project.shortDescription}
              </p>

              {/* Engineering Highlights & Core Capabilities */}
              <div className="mb-6 p-4.5 rounded-2xl bg-[#080d1a]/95 border border-white/[0.08] shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    Engineering Highlights & Feats
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingHighlights(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                    title="Edit Engineering Highlights"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200">
                  {(project.highlights && project.highlights.length > 0
                    ? project.highlights.slice(0, 3)
                    : [
                        'Zero-downtime containerized cloud deployment with automated rollbacks',
                        'High-concurrency event stream processing with deterministic memory footprint',
                        'Multi-layer security isolation with encrypted secret management',
                      ]
                  ).map((hl, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 shadow-[0_0_8px_rgba(16,242,150,0.3)]" />
                      <span className="leading-snug">{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technology Ecosystem Badges */}
              <div className="mb-8">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-2.5">
                  Core Technologies & Architecture
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {project.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0c1222] text-slate-100 border border-white/[0.08] shadow-sm hover:border-emerald-500/35 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BAR: High-Impact Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/[0.08] mt-auto">
              {project.liveDemoUrl && (
                <a
                  href={sanitizeUrl(project.liveDemoUrl)}
                  target={project.liveDemoUrl.startsWith('#') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (project.liveDemoUrl?.startsWith('#')) {
                      e.preventDefault();
                      onOpenDetails(project);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Launch Live System</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}

              {project.githubUrl && (
                <a
                  href={sanitizeUrl(project.githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0c1222] hover:bg-[#121a2e] text-slate-200 hover:text-white border border-white/10 text-sm font-semibold transition-all duration-200 cursor-pointer shadow-md hover:border-emerald-500/30"
                >
                  <Github className="w-4 h-4" />
                  <span>Source Code</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => onOpenDetails(project)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.05] text-sm font-semibold transition-colors cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Architecture Specs</span>
              </button>

              {/* Admin Actions */}
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-1.5 ml-auto">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(project)}
                      className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors"
                      title="Edit project"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(project.id)}
                      className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
        {renderQuickModals()}
      </div>
    );
  }

  // --- GRID MODE: Spacious 2-Column High-Impact Card ---
  return (
    <div style={{ perspective: 1000 }} className="h-full">
      <motion.div
        ref={cardRef}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: is3DActive ? rotateX : 0,
          rotateY: is3DActive ? rotateY : 0,
          transformStyle: is3DActive ? 'preserve-3d' : 'flat',
        }}
        className="group card-chiseled relative h-full flex flex-col rounded-3xl bg-[#080d1a]/95 border border-white/[0.08] hover:border-emerald-500/35 transition-all duration-300 hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Cursor-following subtle radial glow */}
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10"
          style={{
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(16, 242, 150, 0.08), transparent 70%)`,
          }}
        />

        {/* Top subtle hover accent line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />

        {/* Browser Mockup Top Window Chrome */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0d1424] border-b border-white/[0.08] z-20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-xs font-mono text-slate-300 truncate max-w-[220px]">
            {getDomainDisplay()}
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Project Visual Container (Generous Aspect 16:9) */}
        <div 
          onClick={() => onOpenDetails(project)}
          className="relative w-full aspect-[16/9] overflow-hidden bg-[#0d131f] cursor-pointer"
        >
          <img
            src={project.coverImage}
            alt={displayTitle}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.93] group-hover:brightness-100 group-hover:scale-[1.04] transition-all duration-500 ease-out"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#121826] via-transparent to-transparent opacity-90" />

          {/* Category Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
            <span className="px-3 py-1 text-xs font-semibold rounded-md bg-[#101724]/90 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              {project.category}
            </span>
          </div>

          {/* Status Tag */}
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-[#101724]/90 text-slate-200 border border-white/10 backdrop-blur-md">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Project Info Body with Spacious Padding */}
        <div className="flex flex-col flex-grow p-6 sm:p-8 z-20">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <h3 
              onClick={() => onOpenDetails(project)}
              className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors cursor-pointer tracking-tight leading-snug"
            >
              {displayTitle}
            </h3>
            
            <button
              onClick={() => onOpenDetails(project)}
              className="text-slate-400 hover:text-white transition-colors p-1 shrink-0"
              aria-label="Open project details"
            >
              <ArrowUpRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-emerald-400" />
            </button>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-5 flex-grow">
            {project.shortDescription}
          </p>

          {/* Benchmark Metrics Grid */}
          <div className="mb-5 p-3 rounded-xl bg-[#080d1a] border border-white/[0.08] shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Metrics</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingMetrics(true);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                title="Edit Metrics"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {resolvedStats.slice(0, 3).map((stat, i) => (
                <div key={i} className="flex flex-col text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    {stat.label}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-4 border-t border-white/[0.08] mb-5">
            {project.technologies.map((tech, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#0c1222] text-slate-200 border border-white/[0.08] hover:border-emerald-500/35 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.08] mt-auto">
            {project.liveDemoUrl && (
              <a
                href={sanitizeUrl(project.liveDemoUrl)}
                target={project.liveDemoUrl.startsWith('#') ? '_self' : '_blank'}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (project.liveDemoUrl?.startsWith('#')) {
                    e.preventDefault();
                    onOpenDetails(project);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Live Demo</span>
              </a>
            )}

            {project.githubUrl && (
              <a
                href={sanitizeUrl(project.githubUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0c1222] hover:bg-[#121a2e] text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-colors cursor-pointer hover:border-emerald-500/30"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Source</span>
              </a>
            )}

            <button
              onClick={() => onOpenDetails(project)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white transition-colors ml-auto cursor-pointer"
            >
              <span>Case Study</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project.id)}
                className="p-2 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-xs"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </motion.div>
      {renderQuickModals()}
    </div>
  );
};
