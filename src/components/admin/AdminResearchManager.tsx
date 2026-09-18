import React, { useState } from 'react';
import { ResearchItem } from '../../types/portfolio';
import { Plus, Trash2, Edit3, BookOpen, ExternalLink, Calendar, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

interface AdminResearchManagerProps {
  research: ResearchItem[];
  onChange: (research: ResearchItem[]) => void;
}

export const AdminResearchManager: React.FC<AdminResearchManagerProps> = ({
  research,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ResearchItem>>({});

  const handleStartAdd = () => {
    const newRes: ResearchItem = {
      id: 'res-' + Date.now(),
      title: '',
      authors: '',
      venue: '',
      date: '',
      url: '',
      pdfUrl: '',
      doi: '',
      description: '',
      enabled: true,
      order: research.length + 1,
    };
    setFormData(newRes);
    setEditingId(newRes.id);
  };

  const handleStartEdit = (item: ResearchItem) => {
    setFormData({ ...item });
    setEditingId(item.id);
  };

  const handleSave = () => {
    if (!formData.title) {
      alert('Please enter a research paper title.');
      return;
    }

    const updatedItem: ResearchItem = {
      id: formData.id || 'res-' + Date.now(),
      title: formData.title.trim(),
      authors: formData.authors?.trim() || '',
      venue: formData.venue?.trim() || '',
      date: formData.date?.trim() || '',
      url: formData.url?.trim() || '',
      pdfUrl: formData.pdfUrl?.trim() || '',
      doi: formData.doi?.trim() || '',
      description: formData.description?.trim() || '',
      enabled: formData.enabled ?? true,
      order: formData.order ?? (research.length + 1),
    };

    const exists = research.some((r) => r.id === updatedItem.id);
    const nextList = exists
      ? research.map((r) => (r.id === updatedItem.id ? updatedItem : r))
      : [...research, updatedItem];

    onChange(nextList);
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this research publication?')) {
      onChange(research.filter((r) => r.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextList = [...research];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    nextList.forEach((r, idx) => (r.order = idx + 1));
    onChange(nextList);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Research & Publications</h3>
          <p className="text-xs text-slate-400">Add, edit, and curate your scientific papers, preprints, and conference publications.</p>
        </div>

        <button
          onClick={handleStartAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Publication</span>
        </button>
      </div>

      {/* Editor Modal / Form */}
      {editingId && (
        <div className="p-5 rounded-2xl bg-[#121624] border border-emerald-500/30 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{research.some((r) => r.id === editingId) ? 'Edit Publication' : 'New Research Publication'}</span>
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
              Paper Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Efficient Neural Architecture Search using Multi-Task Attention"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Authors (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Piyush Kumar, Jane Doe, John Smith"
                value={formData.authors || ''}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Venue / Conference / Journal
              </label>
              <input
                type="text"
                placeholder="e.g. IEEE Transactions on AI / NeurIPS Workshop"
                value={formData.venue || ''}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Publication Date / Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2024 or Dec 2024"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Paper URL (arXiv / IEEE)
              </label>
              <input
                type="url"
                placeholder="https://arxiv.org/abs/..."
                value={formData.url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Direct PDF Download URL
              </label>
              <input
                type="url"
                placeholder="https://...paper.pdf"
                value={formData.pdfUrl || ''}
                onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              DOI (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 10.1109/CVPR.2024.00123"
              value={formData.doi || ''}
              onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Abstract / Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of findings, methodologies, and contributions..."
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
              <span>Save Publication</span>
            </button>
          </div>
        </div>
      )}

      {/* Publications List */}
      {research.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-[#121624] border border-white/5 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No Research Publications Added</p>
          <p className="text-xs text-slate-500">Click &ldquo;Add Publication&rdquo; above to showcase your academic papers, preprints, or technical reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {research.map((item, idx) => (
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
                  {item.venue && (
                    <div className="text-xs text-emerald-400 font-semibold">{item.venue} {item.date && `(${item.date})`}</div>
                  )}
                  {item.authors && (
                    <div className="text-xs text-slate-400">
                      Authors: {item.authors}
                    </div>
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
                    disabled={idx === research.length - 1}
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
                <p className="mt-2 text-xs text-slate-300 line-clamp-2 leading-relaxed">{item.description}</p>
              )}

              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/5">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Online</span>
                  </a>
                )}
                {item.pdfUrl && (
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Download PDF</span>
                  </a>
                )}
                {item.doi && (
                  <span className="text-[11px] text-slate-400 font-mono">DOI: {item.doi}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
