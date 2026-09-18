import React, { useState } from 'react';
import { 
  PortfolioData, 
  SkillItem, 
  ServiceCardItem, 
  ProjectItem, 
  SocialLink,
  ExperienceItem,
  EducationItem,
  ResearchItem,
  AchievementItem
} from '../types/portfolio';
import { initialPortfolioData } from '../config/portfolioData';
import { 
  Sliders, 
  X, 
  RotateCcw, 
  Copy, 
  Check, 
  Plus,
  Trash2,
  Share2,
  Briefcase,
  GraduationCap,
  BookOpen,
  Trophy,
  Upload
} from 'lucide-react';

interface LiveConfigDrawerProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export const LiveConfigDrawer: React.FC<LiveConfigDrawerProps> = ({
  data,
  onChange,
  isOpen,
  onClose,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<
    'personal' | 'socials' | 'projects' | 'skills' | 'services' | 'experience' | 'education' | 'research' | 'achievements' | 'visuals' | 'export'
  >('personal');
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleImportJSON = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonInput);
      if (parsed && typeof parsed === 'object') {
        onChange({ ...initialPortfolioData, ...parsed });
        setJsonInput('');
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      }
    } catch (e: any) {
      setJsonError(e.message || 'Invalid JSON format');
    }
  };

  const handleResetToDefault = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    onChange(initialPortfolioData);
    setConfirmReset(false);
  };

  return (
    <>
      {/* Floating Toggle Button - Positioned on bottom-left to avoid overlap with Snorlax Pet companion */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={onToggle}
          id="live-config-drawer-trigger"
          aria-label="Open live configuration customizer"
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#141826]/95 border border-emerald-500/30 text-emerald-400 hover:text-white hover:bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all duration-300 backdrop-blur-md text-xs font-bold"
        >
          <Sliders className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
          <span>Live Data Config</span>
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200"
          onClick={onClose}
        >
          {/* Drawer Body */}
          <div 
            className="w-full max-w-2xl h-full bg-[#0d1017] border-l border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111420]">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white leading-none">
                    Portfolio Data Customizer
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage real portfolio data and toggle sections in real time
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToDefault}
                  title={confirmReset ? 'Click again to permanently reset to defaults' : 'Reset to clean defaults'}
                  className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 ${
                    confirmReset
                      ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 animate-pulse'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{confirmReset ? 'Confirm Reset?' : 'Reset'}</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close configuration customizer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 px-4 py-2 bg-[#0a0d14] border-b border-white/5 overflow-x-auto text-xs scrollbar-none">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'personal' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab('socials')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'socials' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                Social Links ({data.socialLinks.filter(s => s.enabled).length})
              </button>
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'projects' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                Projects ({data.projects.filter(p => p.enabled).length})
              </button>
              <button
                onClick={() => setActiveTab('skills')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'skills' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                Skills ({data.skills.filter(s => s.enabled).length})
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'services' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                Services ({data.services.filter(s => s.enabled).length})
              </button>
              <button
                onClick={() => setActiveTab('visuals')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'visuals' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sections & 3D
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'export' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                JSON Export/Import
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
              
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">First Name</label>
                      <input
                        type="text"
                        value={data.personal.firstName}
                        onChange={(e) => onChange({
                          ...data,
                          personal: { ...data.personal, firstName: e.target.value, name: `${e.target.value} ${data.personal.lastName}` }
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={data.personal.lastName}
                        onChange={(e) => onChange({
                          ...data,
                          personal: { ...data.personal, lastName: e.target.value, name: `${data.personal.firstName} ${e.target.value}` }
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={data.personal.title}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Short Description</label>
                    <textarea
                      rows={3}
                      value={data.personal.shortDescription}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, shortDescription: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Degree / Program</label>
                      <input
                        type="text"
                        value={data.personal.degree || ''}
                        onChange={(e) => onChange({
                          ...data,
                          personal: { ...data.personal, degree: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Current Semester / Standing</label>
                      <input
                        type="text"
                        value={data.personal.semester || ''}
                        onChange={(e) => onChange({
                          ...data,
                          personal: { ...data.personal, semester: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">College / University</label>
                    <input
                      type="text"
                      value={data.personal.college || ''}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, college: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Availability Text</label>
                    <input
                      type="text"
                      value={data.personal.availabilityText}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, availabilityText: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Resume / CV URL (Leave empty to hide Download CV button)
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/piyush-cv.pdf"
                      value={data.personal.resumeUrl}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, resumeUrl: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Profile Image URL</label>
                    <input
                      type="text"
                      value={data.personal.profileImage}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, profileImage: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={data.personal.email}
                      onChange={(e) => onChange({
                        ...data,
                        personal: { ...data.personal, email: e.target.value },
                        contact: { ...data.contact, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg bg-[#141826] border border-white/10 text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Socials Tab */}
              {activeTab === 'socials' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-400">
                      Circular Social Buttons (GitHub, Gmail, Instagram, LinkedIn, Codeforces, LeetCode, Hugging Face)
                    </span>
                  </div>

                  {data.socialLinks.map((link, index) => (
                    <div key={link.id} className="p-3 rounded-xl bg-[#131724] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={link.enabled}
                            onChange={(e) => {
                              const updated = [...data.socialLinks];
                              updated[index].enabled = e.target.checked;
                              onChange({ ...data, socialLinks: updated });
                            }}
                            className="rounded text-emerald-500"
                          />
                          <span className="text-xs font-bold text-white capitalize">{link.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Platform: {link.platform}</span>
                      </div>

                      <input
                        type="text"
                        value={link.url}
                        placeholder="URL link or mailto:..."
                        onChange={(e) => {
                          const updated = [...data.socialLinks];
                          updated[index].url = e.target.value;
                          onChange({ ...data, socialLinks: updated });
                        }}
                        className="w-full px-2.5 py-1.5 rounded bg-[#0e111a] border border-white/10 text-white text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Featured Real Projects</span>
                    <button
                      onClick={() => {
                        const newProj: ProjectItem = {
                          id: `proj-${Date.now()}`,
                          title: 'New Real Project',
                          shortDescription: 'Key architecture and technical achievements of this application.',
                          coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
                          technologies: ['React', 'TypeScript', 'Tailwind'],
                          category: 'Fullstack Web',
                          featured: true,
                          enabled: true,
                          order: data.projects.length + 1
                        };
                        onChange({ ...data, projects: [...data.projects, newProj] });
                      }}
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Real Project
                    </button>
                  </div>

                  {data.projects.length === 0 ? (
                    <div className="p-5 rounded-xl bg-[#131724] border border-white/5 text-center text-xs text-slate-400 space-y-2">
                      <p>No projects configured. Projects section currently displays a clean empty state.</p>
                      <button
                        onClick={() => {
                          const newProj: ProjectItem = {
                            id: `proj-${Date.now()}`,
                            title: 'My Project',
                            shortDescription: 'Project summary and architecture details.',
                            coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
                            technologies: ['React', 'TypeScript'],
                            category: 'Web Application',
                            featured: true,
                            enabled: true,
                            order: 1
                          };
                          onChange({ ...data, projects: [newProj] });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold"
                      >
                        + Add First Project
                      </button>
                    </div>
                  ) : (
                    data.projects.map((project, index) => (
                      <div key={project.id} className="p-3 rounded-xl bg-[#131724] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={project.enabled}
                              onChange={(e) => {
                                const updated = [...data.projects];
                                updated[index].enabled = e.target.checked;
                                onChange({ ...data, projects: updated });
                              }}
                              className="rounded text-emerald-500"
                            />
                            <input
                              type="text"
                              value={project.title}
                              placeholder="Project Title"
                              onChange={(e) => {
                                const updated = [...data.projects];
                                updated[index].title = e.target.value;
                                onChange({ ...data, projects: updated });
                              }}
                              className="flex-1 px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-white font-semibold text-xs"
                            />
                          </div>

                          <button
                            onClick={() => {
                              const updated = data.projects.filter(p => p.id !== project.id);
                              onChange({ ...data, projects: updated });
                            }}
                            className="p-1 text-red-400 hover:text-red-300 ml-2"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={project.coverImage}
                          placeholder="Cover Image URL"
                          onChange={(e) => {
                            const updated = [...data.projects];
                            updated[index].coverImage = e.target.value;
                            onChange({ ...data, projects: updated });
                          }}
                          className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={project.category}
                            placeholder="Category (e.g. Fullstack Web)"
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[index].category = e.target.value;
                              onChange({ ...data, projects: updated });
                            }}
                            className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs"
                          />
                          <input
                            type="text"
                            value={project.technologies.join(', ')}
                            placeholder="Technologies (comma separated)"
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[index].technologies = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                              onChange({ ...data, projects: updated });
                            }}
                            className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={project.liveDemoUrl || ''}
                            placeholder="Live Demo URL (leave blank if none)"
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[index].liveDemoUrl = e.target.value || undefined;
                              onChange({ ...data, projects: updated });
                            }}
                            className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs"
                          />
                          <input
                            type="text"
                            value={project.githubUrl || ''}
                            placeholder="GitHub URL (leave blank if none)"
                            onChange={(e) => {
                              const updated = [...data.projects];
                              updated[index].githubUrl = e.target.value || undefined;
                              onChange({ ...data, projects: updated });
                            }}
                            className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={project.shortDescription}
                          placeholder="Short summary of project"
                          onChange={(e) => {
                            const updated = [...data.projects];
                            updated[index].shortDescription = e.target.value;
                            onChange({ ...data, projects: updated });
                          }}
                          className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs resize-none"
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Technological Foundation Chips</span>
                    <button
                      onClick={() => {
                        const newSkill: SkillItem = {
                          id: `sk-${Date.now()}`,
                          name: 'New Skill',
                          category: 'frontend',
                          color: '#38bdf8',
                          enabled: true,
                          order: data.skills.length + 1
                        };
                        onChange({ ...data, skills: [...data.skills, newSkill] });
                      }}
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Skill
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {data.skills.map((skill, index) => (
                      <div key={skill.id} className="flex items-center gap-2 p-2 rounded-lg bg-[#131724] border border-white/5">
                        <input
                          type="checkbox"
                          checked={skill.enabled}
                          onChange={(e) => {
                            const updated = [...data.skills];
                            updated[index].enabled = e.target.checked;
                            onChange({ ...data, skills: updated });
                          }}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <input
                          type="text"
                          value={skill.name}
                          onChange={(e) => {
                            const updated = [...data.skills];
                            updated[index].name = e.target.value;
                            onChange({ ...data, skills: updated });
                          }}
                          className="flex-1 px-2 py-1 rounded bg-[#0e111a] border border-white/10 text-white text-xs"
                        />
                        <button
                          onClick={() => {
                            const updated = data.skills.filter(s => s.id !== skill.id);
                            onChange({ ...data, skills: updated });
                          }}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400">Services & Capabilities</span>
                    <button
                      onClick={() => {
                        const newService: ServiceCardItem = {
                          id: `srv-${Date.now()}`,
                          title: 'New Service',
                          description: 'Description of capabilities provided.',
                          iconType: 'code',
                          iconColor: '#38bdf8',
                          enabled: true,
                          order: data.services.length + 1
                        };
                        onChange({ ...data, services: [...data.services, newService] });
                      }}
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Service Card
                    </button>
                  </div>

                  {data.services.map((service, index) => (
                    <div key={service.id} className="p-3 rounded-xl bg-[#131724] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={service.enabled}
                            onChange={(e) => {
                              const updated = [...data.services];
                              updated[index].enabled = e.target.checked;
                              onChange({ ...data, services: updated });
                            }}
                            className="rounded text-emerald-500"
                          />
                          <input
                            type="text"
                            value={service.title}
                            onChange={(e) => {
                              const updated = [...data.services];
                              updated[index].title = e.target.value;
                              onChange({ ...data, services: updated });
                            }}
                            className="flex-1 px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-white font-semibold text-xs"
                          />
                        </div>

                        <button
                          onClick={() => {
                            const updated = data.services.filter(s => s.id !== service.id);
                            onChange({ ...data, services: updated });
                          }}
                          className="p-1 text-red-400 hover:text-red-300 ml-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        value={service.description}
                        onChange={(e) => {
                          const updated = [...data.services];
                          updated[index].description = e.target.value;
                          onChange({ ...data, services: updated });
                        }}
                        className="w-full px-2.5 py-1 rounded bg-[#0e111a] border border-white/10 text-slate-300 text-xs resize-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Visuals & Section Toggles Tab */}
              {activeTab === 'visuals' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#131724] border border-white/5 space-y-3">
                    <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                      3D & Animation Engine
                    </h4>
                    
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Enable 3D Parallax & Mouse Tilt</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.enable3DEffects}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, enable3DEffects: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Show Hero Profile Card</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showProfileVisual}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showProfileVisual: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>
                  </div>

                  <div className="p-4 rounded-xl bg-[#131724] border border-white/5 space-y-3">
                    <h4 className="font-semibold text-white text-xs uppercase tracking-wider">
                      Section Visibility Toggles
                    </h4>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Services Section</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionServices}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionServices: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Skills Section</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionSkills}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionSkills: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Projects Section</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionProjects}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionProjects: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">About Me Section</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionAbout}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionAbout: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Work Experience Section</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionExperience}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionExperience: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Education Section</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionEducation}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionEducation: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Research Publications</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionResearch}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionResearch: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Achievements & Awards</span>
                      <input
                        type="checkbox"
                        checked={data.visualSettings.showSectionAchievements}
                        onChange={(e) => onChange({
                          ...data,
                          visualSettings: { ...data.visualSettings, showSectionAchievements: e.target.checked }
                        })}
                        className="rounded text-emerald-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Export/Import JSON Tab */}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Current JSON Configuration</span>
                    <button
                      onClick={handleCopyJSON}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-[#07090e] border border-white/10 text-slate-300 text-xs font-mono overflow-auto max-h-[260px]">
                    {JSON.stringify(data, null, 2)}
                  </pre>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Import Real JSON Data</span>
                    <textarea
                      rows={3}
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder="Paste valid JSON here to import..."
                      className="w-full p-2.5 rounded-xl bg-[#0e111a] border border-white/10 text-white text-xs font-mono"
                    />
                    {jsonError && (
                      <p className="text-xs text-red-400">{jsonError}</p>
                    )}
                    {importSuccess && (
                      <p className="text-xs text-emerald-400 font-medium">✓ Configuration imported successfully!</p>
                    )}
                    <button
                      onClick={handleImportJSON}
                      disabled={!jsonInput.trim()}
                      className="px-4 py-2 rounded-lg bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition-colors disabled:opacity-40"
                    >
                      Import Configuration
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
