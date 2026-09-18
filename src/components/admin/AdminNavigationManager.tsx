import React, { useState } from 'react';
import { NavItem } from '../../types/portfolio';
import { Plus, Trash2, ArrowUp, ArrowDown, Compass, Check, Link2, Eye, EyeOff } from 'lucide-react';

interface AdminNavigationManagerProps {
  navigation: NavItem[];
  onChange: (navigation: NavItem[]) => void;
}

export const AdminNavigationManager: React.FC<AdminNavigationManagerProps> = ({
  navigation,
  onChange,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newHref, setNewHref] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const item: NavItem = {
      id: 'nav-' + Date.now(),
      label: newLabel.trim(),
      href: newHref.trim() || `#${newLabel.trim().toLowerCase().replace(/\s+/g, '-')}`,
      enabled: true,
      order: navigation.length + 1,
    };
    onChange([...navigation, item]);
    setNewLabel('');
    setNewHref('');
  };

  const handleUpdate = (id: string, updates: Partial<NavItem>) => {
    onChange(navigation.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this navigation menu link?')) {
      onChange(navigation.filter((n) => n.id !== id));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextList = [...navigation];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    nextList.forEach((n, idx) => (n.order = idx + 1));
    onChange(nextList);
  };

  const handleRestoreDefaults = () => {
    if (confirm('Restore standard header navigation links?')) {
      const defaultNav: NavItem[] = [
        { id: 'nav-1', label: 'About', href: '#about', enabled: true, order: 1 },
        { id: 'nav-2', label: 'Skills', href: '#skills', enabled: true, order: 2 },
        { id: 'nav-3', label: 'Services', href: '#services', enabled: true, order: 3 },
        { id: 'nav-4', label: 'Projects', href: '#projects', enabled: true, order: 4 },
        { id: 'nav-5', label: 'Experience', href: '#experience', enabled: true, order: 5 },
        { id: 'nav-6', label: 'Education', href: '#education', enabled: true, order: 6 },
        { id: 'nav-7', label: 'Research', href: '#research', enabled: true, order: 7 },
        { id: 'nav-8', label: 'Achievements', href: '#achievements', enabled: true, order: 8 },
        { id: 'nav-9', label: 'Contact', href: '#contact', enabled: true, order: 9 },
      ];
      onChange(defaultNav);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Navigation Menu Bar</h3>
          <p className="text-xs text-slate-400">Configure top navigation menu items, reorder links, and toggle visibility.</p>
        </div>

        <button
          type="button"
          onClick={handleRestoreDefaults}
          className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
        >
          Reset to Standard
        </button>
      </div>

      {/* Add New Nav Item Form */}
      <div className="p-4 rounded-xl bg-[#121624] border border-white/5 space-y-3">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add New Menu Item</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Menu Label *</label>
            <input
              type="text"
              placeholder="e.g. Case Studies / Blog / Resume"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Section or URL *</label>
            <input
              type="text"
              placeholder="e.g. #projects or https://..."
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#171c2d] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newLabel.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Navbar</span>
          </button>
        </div>
      </div>

      {/* Nav Items List */}
      <div className="space-y-2">
        {navigation.map((item, idx) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              item.enabled ? 'bg-[#121624] border-white/5' : 'bg-[#0e121e] border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <span className="w-5 text-center text-xs font-mono text-slate-500">{idx + 1}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <input
                  type="text"
                  value={item.label}
                  onChange={(e) => handleUpdate(item.id, { label: e.target.value })}
                  className="px-2.5 py-1 rounded bg-[#171c2d] text-white text-xs font-semibold border border-white/5"
                  placeholder="Label"
                />
                <input
                  type="text"
                  value={item.href}
                  onChange={(e) => handleUpdate(item.id, { href: e.target.value })}
                  className="px-2.5 py-1 rounded bg-[#171c2d] text-emerald-400 text-xs font-mono border border-white/5"
                  placeholder="#section"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleUpdate(item.id, { enabled: !item.enabled })}
                className={`p-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 ${
                  item.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-400'
                }`}
                title={item.enabled ? 'Enabled in Navbar' : 'Hidden from Navbar'}
              >
                {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{item.enabled ? 'Visible' : 'Hidden'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleMove(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(idx, 'down')}
                disabled={idx === navigation.length - 1}
                className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
