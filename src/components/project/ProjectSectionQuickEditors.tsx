import React, { useState } from 'react';
import { X, Check, Plus, Trash2, RotateCcw, Sparkles, Activity, Terminal, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditHighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  initialHighlights?: string[];
  onSave: (highlights: string[]) => void;
}

export const EditHighlightsModal: React.FC<EditHighlightsModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  initialHighlights = [],
  onSave,
}) => {
  const defaultHighlights = [
    'Zero-downtime containerized cloud deployment with automated rollbacks',
    'High-concurrency event stream processing with deterministic memory footprint',
    'Multi-layer security isolation with encrypted secret management',
  ];

  const [highlights, setHighlights] = useState<string[]>(
    initialHighlights.length > 0 ? initialHighlights : defaultHighlights
  );

  if (!isOpen) return null;

  const handleAdd = () => {
    setHighlights([...highlights, '']);
  };

  const handleUpdate = (idx: number, val: string) => {
    const updated = [...highlights];
    updated[idx] = val;
    setHighlights(updated);
  };

  const handleRemove = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const handleResetDefaults = () => {
    setHighlights(defaultHighlights);
  };

  const handleSave = () => {
    const filtered = highlights.map((h) => h.trim()).filter(Boolean);
    onSave(filtered.length > 0 ? filtered : defaultHighlights);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl rounded-2xl bg-[#090e1a] border border-emerald-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 px-6 bg-gradient-to-r from-[#0d1627] to-[#0a101d] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Engineering Highlights & Feats</h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">{projectTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <p className="text-xs text-slate-400">
              Customize the technical accomplishments and architecture milestones highlighted in the project card.
            </p>

            <div className="space-y-3">
              {highlights.map((hl, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/5 text-[11px] font-mono text-emerald-400 font-bold shrink-0 mt-2 border border-white/10">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      value={hl}
                      onChange={(e) => handleUpdate(idx, e.target.value)}
                      placeholder="Enter technical achievement..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 resize-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    disabled={highlights.length <= 1}
                    className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-30 disabled:pointer-events-none mt-1 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 text-xs font-semibold transition-all hover:border-emerald-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Highlight</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-[#0c1220] border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Highlights</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface EditMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  initialStats?: { label: string; value: string }[];
  onSave: (stats: { label: string; value: string }[]) => void;
}

export const EditMetricsModal: React.FC<EditMetricsModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  initialStats = [],
  onSave,
}) => {
  const defaultStats = [
    { label: 'Uptime SLA', value: '99.9%' },
    { label: 'Latency P99', value: '< 100ms' },
    { label: 'Architecture', value: 'Distributed' },
  ];

  const [stats, setStats] = useState<{ label: string; value: string }[]>(
    initialStats.length > 0 ? initialStats : defaultStats
  );

  if (!isOpen) return null;

  const handleUpdate = (idx: number, field: 'label' | 'value', val: string) => {
    const updated = [...stats];
    updated[idx] = { ...updated[idx], [field]: val };
    setStats(updated);
  };

  const handleAdd = () => {
    setStats([...stats, { label: 'Metric', value: 'Value' }]);
  };

  const handleRemove = (idx: number) => {
    setStats(stats.filter((_, i) => i !== idx));
  };

  const handleResetDefaults = () => {
    setStats(defaultStats);
  };

  const handleSave = () => {
    const filtered = stats.filter((s) => s.label.trim() && s.value.trim());
    onSave(filtered.length > 0 ? filtered : defaultStats);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl rounded-2xl bg-[#090e1a] border border-emerald-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 px-6 bg-gradient-to-r from-[#0d1627] to-[#0a101d] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Architecture & SLA Metrics</h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">{projectTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <p className="text-xs text-slate-400">
              Update the performance benchmarks and architectural indicators displayed under the system visualizer.
            </p>

            <div className="space-y-3">
              {stats.map((st, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#111827] border border-white/10 flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Metric Label
                      </label>
                      <input
                        type="text"
                        value={st.label}
                        onChange={(e) => handleUpdate(idx, 'label', e.target.value)}
                        placeholder="e.g., Uptime SLA"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0c1220] border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                        Metric Value
                      </label>
                      <input
                        type="text"
                        value={st.value}
                        onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
                        placeholder="e.g., 99.9%"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0c1220] border border-white/10 text-emerald-400 font-extrabold text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    disabled={stats.length <= 1}
                    className="p-2 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors mt-3 sm:mt-0"
                    title="Delete metric"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-400 text-xs font-semibold transition-all hover:border-emerald-500/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Metric</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-[#0c1220] border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Metrics</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface EditTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  initialTelemetry?: string;
  onSave: (telemetry: string) => void;
}

export const EditTelemetryModal: React.FC<EditTelemetryModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  initialTelemetry = '',
  onSave,
}) => {
  const defaultTelemetry = 'build: success · cluster: production-west · telemetry: healthy';
  const [telemetry, setTelemetry] = useState(initialTelemetry || defaultTelemetry);

  const presets = [
    'build: success · cluster: production-west · telemetry: healthy',
    'build: success · cluster: production-east · telemetry: healthy',
    'pipeline: verified · cluster: multi-region · latency: 12ms',
    'deploy: active · cluster: edge-cloud · uptime: 99.99%',
    'stream: nominal · cluster: kubernetes-prod · memory: bounded',
  ];

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(telemetry.trim() || defaultTelemetry);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg rounded-2xl bg-[#090e1a] border border-emerald-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 px-6 bg-gradient-to-r from-[#0d1627] to-[#0a101d] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Terminal & Telemetry Status</h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">{projectTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
                Terminal Status String
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={telemetry}
                  onChange={(e) => setTelemetry(e.target.value)}
                  placeholder="e.g., build: success · cluster: production-west · telemetry: healthy"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#111827] border border-white/10 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
                />
                <Terminal className="w-4 h-4 text-emerald-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-2">
                Quick Presets (Click to apply)
              </label>
              <div className="space-y-1.5">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTelemetry(preset)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/5 text-[11px] font-mono text-slate-300 hover:text-emerald-300 transition-colors truncate"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-[#0c1220] border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Status</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
