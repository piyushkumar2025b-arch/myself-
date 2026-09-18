import React, { useState } from 'react';
import { AchievementItem } from '../../types/portfolio';
import { Plus, Trash2, Edit3, Award, ExternalLink, Calendar, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminAchievementsManagerProps {
  achievements: AchievementItem[];
  onChange: (achievements: AchievementItem[]) => void;
}

export const AdminAchievementsManager: React.FC<AdminAchievementsManagerProps> = ({
  achievements,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AchievementItem>>({});

  const handleStartAdd = () => {
    const newAch: AchievementItem = {
      id: 'ach-' + Date.now(),
      title: '',
      issuer: '',
      date: '',
      description: '',
      url: '',
      enabled: true,
      order: achievements.length + 1,
    };
    setFormData(newAch);
    setEditingId(newAch.id);
  };

  const handleStartEdit = (item: AchievementItem) => {
    setFormData({ ...item });
    setEditingId(item.id);
  };

  const handleSave = () => {
    if (!formData.title) {
      alert('Please enter an achievement title.');
      return;
    }

    const updatedItem: AchievementItem = {
      id: formData.id || 'ach-' + Date.now(),
      title: formData.title.trim(),
      issuer: formData.issuer?.trim() || '',
      date: formData.date?.trim() || '',
      description: formData.description?.trim() || '',
      url: formData.url?.trim() || '',
      enabled: formData.enabled ?? true,
      order: formData.order ?? (achievements.length + 1),
    };

    const exists = achievements.some((a) => a.id === updatedItem.id);
    const nextList = exists
      ? achievements.map((a) => (a.id === updatedItem.id ? updatedItem : a))
      : [...achievements, updatedItem];

    onChange(nextList);
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this achievement entry?')) {
      onChange(achievements.filter((a) => a.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextList = [...achievements];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    nextList.forEach((a, idx) => (a.order = idx + 1));
    onChange(nextList);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Honors, Awards & Achievements</h3>
          <p className="text-xs text-slate-400">Add hackathon wins, competitive programming ranks, certifications, and recognition.</p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Achievement</span>
        </button>
      </div>

      {/* Editor Modal / Form */}
      {editingId && (
        <div className="p-5 rounded-2xl bg-[#121624] border border-emerald-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>{achievements.some((a) => a.id === editingId) ? 'Edit Achievement' : 'New Achievement Entry'}</span>
            </h4>
            <button
              onClick={() => setEditingId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Award / Recognition Title *
            </label>
            <input
              type="text"
              placeholder="e.g. 1st Place — National Hackathon 2024 / LeetCode Guardian"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Issuing Organization / Event
              </label>
              <input
                type="text"
                placeholder="e.g. Google Developers Group / VIT Chennai / Smart India Hackathon"
                value={formData.issuer || ''}
                onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Date / Year
              </label>
              <input
                type="text"
                placeholder="e.g. November 2024"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Certificate / Proof / Announcement Link (optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description / Impact
            </label>
            <textarea
              rows={3}
              placeholder="Describe the competition scale, what you built, or the milestone reached..."
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
              <span>Save Achievement</span>
            </button>
          </div>
        </div>
      )}

      {/* Achievements List */}
      {achievements.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5 space-y-2">
          <Award className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Achievements Recorded Yet</p>
          <p className="text-xs text-slate-500">Click &ldquo;Add Achievement&rdquo; above to list awards, hackathon recognitions, or badges.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.enabled ? 'bg-[#121624] border-white/5' : 'bg-[#0e121e] border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    {!item.enabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">Hidden</span>
                    )}
                  </div>
                  {item.issuer && (
                    <div className="text-xs text-emerald-400 font-semibold">{item.issuer} {item.date && `&bull; ${item.date}`}</div>
                  )}
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
                    disabled={idx === achievements.length - 1}
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

              {item.url && (
                <div className="mt-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Credential / Certificate</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
