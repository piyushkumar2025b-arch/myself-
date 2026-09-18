import React, { useState, useMemo } from 'react';
import { ProjectItem } from '../types/portfolio';
import { ProjectCard } from './ProjectCard';
import { ProjectDetailModal } from './ProjectDetailModal';
import { 
  ArrowRight, 
  FolderGit2, 
  Plus, 
  LayoutList, 
  LayoutGrid, 
  Sparkles,
  Server,
  Activity,
  Cpu,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Reveal } from './ui/Reveal';

interface ProjectsSectionProps {
  title: string;
  subtitle: string;
  projects: ProjectItem[];
  enable3D?: boolean;
  onOpenAddProject?: () => void;
  onEditProject?: (project: ProjectItem) => void;
  onDeleteProject?: (projectId: string) => void;
  onUpdateProject?: (project: ProjectItem) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  title,
  subtitle,
  projects,
  enable3D = true,
  onOpenAddProject,
  onEditProject,
  onDeleteProject,
  onUpdateProject,
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'showcase' | 'grid'>('showcase');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const enabledProjects = useMemo(() => {
    return [...projects]
      .filter(item => item.enabled)
      .sort((a, b) => a.order - b.order);
  }, [projects]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    enabledProjects.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [enabledProjects]);

  // Filter projects by category and optional search query
  const filteredProjects = useMemo(() => {
    return enabledProjects.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = (p.displayTitle || p.name || p.title || '').toLowerCase().includes(q);
      const descMatch = (p.shortDescription || '').toLowerCase().includes(q);
      const techMatch = p.technologies.some(t => t.toLowerCase().includes(q));
      return titleMatch || descMatch || techMatch;
    });
  }, [enabledProjects, selectedCategory, searchQuery]);

  // If showAll is false and no category filter/search query, show first 4 featured projects
  const displayedProjects = (showAll || selectedCategory !== 'All' || searchQuery.trim() !== '') 
    ? filteredProjects 
    : filteredProjects.slice(0, 4);

  return (
    <section id="projects" className="py-24 sm:py-32 relative">
      {/* Background ambient radial glows (no deep black background) */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[500px] bg-emerald-500/[0.05] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Reveal direction="up">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 sm:mb-16">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Engineering Systems & Architecture</span>
              </div>
              <h2 
                id="projects-section-heading"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4"
              >
                Production <span className="text-gradient-name-first">Projects & Systems.</span>
              </h2>
              <p 
                id="projects-section-subtitle"
                className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed"
              >
                {subtitle || 'Architectural software, autonomous pipelines, machine learning workbenches, and low-latency engines.'}
              </p>
            </div>

            {/* Controls: Layout Switcher + Upload + View All */}
            <div className="flex items-center gap-3 self-start lg:self-end flex-wrap">
              {/* Layout Mode Switcher (Showcase vs 2-Col Grid) */}
              <div className="flex items-center p-1 rounded-xl bg-[#090e1c] border border-white/[0.08] shadow-inner">
                <button
                  type="button"
                  onClick={() => setLayoutMode('showcase')}
                  title="Showcase View (Full-Width Case Study)"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    layoutMode === 'showcase'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-extrabold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                  <span className="hidden sm:inline">Grand Showcase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  title="2-Column Wide Grid View"
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    layoutMode === 'grid'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-extrabold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid System</span>
                </button>
              </div>

              {onOpenAddProject && (
                <button
                  onClick={onOpenAddProject}
                  id="upload-project-header-btn"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Project</span>
                </button>
              )}

              {enabledProjects.length > 4 && selectedCategory === 'All' && !searchQuery && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  id="view-all-projects-btn"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-200 hover:text-white transition-colors group px-4 py-2.5 rounded-xl bg-[#090e1c] border border-white/[0.08] hover:border-emerald-500/35 cursor-pointer shadow-md"
                >
                  <span>{showAll ? 'Featured Systems' : `All Systems (${enabledProjects.length})`}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 text-emerald-400" />
                </button>
              )}
            </div>
          </div>
        </Reveal>

        {/* Telemetry Architecture Metric Strip */}
        <Reveal direction="up" delay={0.05}>
          <div className="card-chiseled grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 p-4 rounded-2xl bg-[#080d1a]/95 border border-white/[0.08] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_12px_rgba(16,242,150,0.15)]">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Production Deployments</span>
                <span className="text-base font-extrabold text-white">{enabledProjects.length}+ Active Systems</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.15)]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Inference / Latency</span>
                <span className="text-base font-extrabold text-white">&lt; 100ms P99 SLA</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Graphics & Engine</span>
                <span className="text-base font-extrabold text-white">60 FPS Hardware WebGL</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-[0_0_12px_rgba(129,140,248,0.15)]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Security & Memory</span>
                <span className="text-base font-extrabold text-white">Zero Runtime Leaks</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Category Pills & Search Filter Bar */}
        <Reveal direction="up" delay={0.08}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-12">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 font-extrabold'
                      : 'bg-[#080d1a] text-slate-300 hover:text-white border border-white/[0.08] hover:border-emerald-500/35'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by tech or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#080d1a] border border-white/[0.08] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/25 transition-colors"
              />
            </div>
          </div>
        </Reveal>

        {/* Empty State when no projects match */}
        {displayedProjects.length === 0 ? (
          <Reveal direction="up">
            <div className="max-w-xl mx-auto p-10 rounded-2xl bg-[#141b2b] border border-white/[0.08] text-center flex flex-col items-center justify-center shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <FolderGit2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No Projects Found
              </h3>
              <p className="text-sm text-slate-300 mb-6 max-w-md leading-relaxed">
                {searchQuery ? `No systems match the filter "${searchQuery}". Try a different term or clear the search.` : 'Add your real projects, live links, and case studies at any time.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-[#182234] text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                >
                  Clear Search Filter
                </button>
              ) : onOpenAddProject ? (
                <button
                  onClick={onOpenAddProject}
                  id="add-first-project-btn"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your Project</span>
                </button>
              ) : null}
            </div>
          </Reveal>
        ) : layoutMode === 'showcase' ? (
          /* SHOWCASE MODE: Grand Full-Width Architectural Editorial Layout with Generous Space */
          <div className="space-y-16 sm:space-y-24 lg:space-y-28">
            {displayedProjects.map((project, index) => (
              <Reveal key={project.id} delay={index * 0.08} direction="up">
                <ProjectCard
                  project={project}
                  enable3D={enable3D}
                  layoutMode="showcase"
                  index={index}
                  onOpenDetails={(p) => setSelectedProject(p)}
                  onEdit={onEditProject}
                  onDelete={onDeleteProject}
                  onUpdateProject={onUpdateProject}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          /* GRID MODE: Generous 2-Column Wide Cards Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
            {displayedProjects.map((project, index) => (
              <Reveal key={project.id} delay={index * 0.06} direction="up">
                <ProjectCard
                  project={project}
                  enable3D={enable3D}
                  layoutMode="grid"
                  index={index}
                  onOpenDetails={(p) => setSelectedProject(p)}
                  onEdit={onEditProject}
                  onDelete={onDeleteProject}
                  onUpdateProject={onUpdateProject}
                />
              </Reveal>
            ))}
          </div>
        )}

      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
          onUpdateProject={onUpdateProject}
        />
      )}
    </section>
  );
};
