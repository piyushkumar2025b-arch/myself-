import React, { useState } from 'react';
import { EducationItem } from '../../types/portfolio';
import { Plus, Trash2, Edit3, GraduationCap, MapPin, Calendar, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminEducationManagerProps {
  education: EducationItem[];
  onChange: (education: EducationItem[]) => void;
}

export const AdminEducationManager: React.FC<AdminEducationManagerProps> = ({
  education,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<EducationItem>>({});

  const handleStartAdd = () => {
    const newEdu: EducationItem = {
      id: 'edu-' + Date.now(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      grade: '',
      description: '',
      logo: '',
      url: '',
      enabled: true,
      order: education.length + 1,
    };
    setFormData(newEdu);
    setEditingId(newEdu.id);
  };

  const handleStartEdit = (item: EducationItem) => {
    setFormData({ ...item });
    setEditingId(item.id);
  };

  const handleSave = () => {
    if (!formData.institution || !formData.degree) {
      alert('Please enter both Institution and Degree.');
      return;
    }

    const updatedItem: EducationItem = {
      id: formData.id || 'edu-' + Date.now(),
      institution: formData.institution.trim(),
      degree: formData.degree.trim(),
      field: formData.field?.trim() || '',
      startDate: formData.startDate?.trim() || '',
      endDate: formData.endDate?.trim() || '',
      grade: formData.grade?.trim() || '',
      description: formData.description?.trim() || '',
      logo: formData.logo?.trim() || '',
      url: formData.url?.trim() || '',
      enabled: formData.enabled ?? true,
      order: formData.order ?? (education.length + 1),
    };

    const exists = education.some((e) => e.id === updatedItem.id);
    const nextList = exists
      ? education.map((e) => (e.id === updatedItem.id ? updatedItem : e))
      : [...education, updatedItem];

    onChange(nextList);
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this education entry?')) {
      onChange(education.filter((e) => e.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextList = [...education];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    nextList.forEach((e, idx) => (e.order = idx + 1));
    onChange(nextList);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Education & Academic Background</h3>
          <p className="text-xs text-slate-400">Manage your university, degrees, CGPA/grades, and coursework.</p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Education</span>
        </button>
      </div>

      {/* Editor Modal / Form */}
      {editingId && (
        <div className="p-5 rounded-2xl bg-[#121624] border border-emerald-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>{education.some((e) => e.id === editingId) ? 'Edit Education' : 'New Education Entry'}</span>
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
                Institution / University *
              </label>
              <input
                type="text"
                placeholder="e.g. Vellore Institute of Technology (VIT), Chennai"
                value={formData.institution || ''}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Degree *
              </label>
              <input
                type="text"
                placeholder="e.g. Bachelor of Technology (B.Tech)"
                value={formData.degree || ''}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Field of Study
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science & Engineering (Core)"
                value={formData.field || ''}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Start Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2023"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                End Year / Expected
              </label>
              <input
                type="text"
                placeholder="e.g. 2027"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Grade / CGPA (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. CGPA: 9.1 / 10.0"
                value={formData.grade || ''}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                University URL (optional)
              </label>
              <input
                type="url"
                placeholder="https://chennai.vit.ac.in"
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description / Coursework / Highlights
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Relevant Coursework: Data Structures & Algorithms, Operating Systems, Machine Learning..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 resize-y"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
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
              <span>Save Education</span>
            </button>
          </div>
        </div>
      )}

      {/* Education List */}
      {education.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5 space-y-2">
          <GraduationCap className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Education Entries Added</p>
          <p className="text-xs text-slate-500">Click &ldquo;Add Education&rdquo; above to record your university degree, college, or high school qualifications.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {education.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.enabled ? 'bg-[#121624] border-white/5' : 'bg-[#0e121e] border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.degree} {item.field && `in ${item.field}`}</span>
                    {!item.enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Hidden</span>
                    )}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold">{item.institution}</div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {item.startDate} &mdash; {item.endDate}
                    </span>
                    {item.grade && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                        {item.grade}
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
                    disabled={idx === education.length - 1}
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

              {item.description && (
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
