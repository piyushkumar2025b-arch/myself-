import React, { useState } from 'react';
import { ExperienceItem } from '../../types/portfolio';
import { Plus, Trash2, Edit3, Briefcase, MapPin, Calendar, Globe, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminExperienceManagerProps {
  experiences: ExperienceItem[];
  onChange: (experiences: ExperienceItem[]) => void;
}

export const AdminExperienceManager: React.FC<AdminExperienceManagerProps> = ({
  experiences,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ExperienceItem>>({});
  const [newBullet, setNewBullet] = useState('');
  const [newTech, setNewTech] = useState('');

  const handleStartAdd = () => {
    const newExp: ExperienceItem = {
      id: 'exp-' + Date.now(),
      organization: '',
      role: '',
      location: '',
      startDate: '',
      endDate: 'Present',
      isCurrent: true,
      description: [],
      technologies: [],
      companyUrl: '',
      logo: '',
      enabled: true,
      order: experiences.length + 1,
    };
    setFormData(newExp);
    setEditingId(newExp.id);
  };

  const handleStartEdit = (item: ExperienceItem) => {
    setFormData({ ...item });
    setEditingId(item.id);
  };

  const handleSave = () => {
    if (!formData.organization || !formData.role) {
      alert('Please enter both Role and Company/Organization name.');
      return;
    }

    const updatedItem: ExperienceItem = {
      id: formData.id || 'exp-' + Date.now(),
      organization: formData.organization.trim(),
      role: formData.role.trim(),
      location: formData.location?.trim() || '',
      startDate: formData.startDate?.trim() || '',
      endDate: formData.isCurrent ? 'Present' : (formData.endDate?.trim() || ''),
      isCurrent: Boolean(formData.isCurrent),
      description: formData.description || [],
      technologies: formData.technologies || [],
      companyUrl: formData.companyUrl?.trim() || '',
      logo: formData.logo?.trim() || '',
      enabled: formData.enabled ?? true,
      order: formData.order ?? (experiences.length + 1),
    };

    const exists = experiences.some((e) => e.id === updatedItem.id);
    const nextList = exists
      ? experiences.map((e) => (e.id === updatedItem.id ? updatedItem : e))
      : [...experiences, updatedItem];

    onChange(nextList);
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this experience entry?')) {
      onChange(experiences.filter((e) => e.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextList = [...experiences];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    nextList.forEach((e, idx) => (e.order = idx + 1));
    onChange(nextList);
  };

  const handleAddBullet = () => {
    if (!newBullet.trim()) return;
    setFormData({
      ...formData,
      description: [...(formData.description || []), newBullet.trim()],
    });
    setNewBullet('');
  };

  const handleRemoveBullet = (bIdx: number) => {
    setFormData({
      ...formData,
      description: (formData.description || []).filter((_, idx) => idx !== bIdx),
    });
  };

  const handleAddTech = () => {
    if (!newTech.trim()) return;
    const current = formData.technologies || [];
    if (!current.includes(newTech.trim())) {
      setFormData({
        ...formData,
        technologies: [...current, newTech.trim()],
      });
    }
    setNewTech('');
  };

  const handleRemoveTech = (tag: string) => {
    setFormData({
      ...formData,
      technologies: (formData.technologies || []).filter((t) => t !== tag),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Work & Internship Experience</h3>
          <p className="text-xs text-slate-400">Add, edit, or remove professional roles and responsibilities.</p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Experience</span>
        </button>
      </div>

      {/* Editor Modal / Form */}
      {editingId && (
        <div className="p-5 rounded-2xl bg-[#121624] border border-emerald-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>{experiences.some((e) => e.id === editingId) ? 'Edit Experience' : 'New Experience Entry'}</span>
            </h4>
            <button
              onClick={() => setEditingId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Role / Job Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Software Engineer Intern"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Company / Organization *
              </label>
              <input
                type="text"
                placeholder="e.g. Google / Microsoft / Startup"
                value={formData.organization || ''}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. Remote or Bengaluru, India"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Start Date
              </label>
              <input
                type="text"
                placeholder="e.g. May 2024"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                End Date
              </label>
              <input
                type="text"
                disabled={formData.isCurrent}
                placeholder="e.g. August 2024 or Present"
                value={formData.isCurrent ? 'Present' : (formData.endDate || '')}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.isCurrent || false}
                onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500"
              />
              <span>I currently work in this role</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={formData.enabled ?? true}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-500"
              />
              <span>Visible on public website</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Company Website URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.companyUrl || ''}
                onChange={(e) => setFormData({ ...formData, companyUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Logo / Icon URL (optional)
              </label>
              <input
                type="text"
                placeholder="https://... or icon"
                value={formData.logo || ''}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Key Achievements / Bullet Points */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Responsibilities & Accomplishments (Bullet points)
            </label>
            <div className="space-y-1.5">
              {(formData.description || []).map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-center gap-2 p-2 rounded-lg bg-[#171c2d] border border-white/5">
                  <span className="text-emerald-400 text-xs font-bold shrink-0">&bull;</span>
                  <span className="text-xs text-slate-200 flex-1">{bullet}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(bIdx)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add bullet point describing your work..."
                value={newBullet}
                onChange={(e) => setNewBullet(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBullet();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddBullet}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-semibold"
              >
                Add Bullet
              </button>
            </div>
          </div>

          {/* Technologies Used */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Technologies & Tools Used
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(formData.technologies || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tag)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add technology (e.g. Next.js, Python, PyTorch)..."
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 font-semibold"
              >
                Add Tech
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              <Check className="w-4 h-4" />
              <span>Save Experience</span>
            </button>
          </div>
        </div>
      )}

      {/* Experience List */}
      {experiences.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5 space-y-2">
          <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Work Experiences Added</p>
          <p className="text-xs text-slate-500">Click &ldquo;Add Experience&rdquo; above to record your internships, full-time roles, or research positions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiences.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.enabled ? 'bg-[#121624] border-white/5' : 'bg-[#0e121e] border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.role}</span>
                    <span className="text-xs text-emerald-400 font-semibold">@ {item.organization}</span>
                    {!item.enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Hidden</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {item.startDate} &mdash; {item.endDate}
                    </span>
                    {item.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === experiences.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs"
                    title="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {item.description && item.description.length > 0 && (
                <ul className="mt-3 text-xs text-slate-300 space-y-1 list-disc list-inside">
                  {item.description.map((d, i) => (
                    <li key={i} className="line-clamp-1">{d}</li>
                  ))}
                </ul>
              )}

              {item.technologies && item.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.technologies.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
