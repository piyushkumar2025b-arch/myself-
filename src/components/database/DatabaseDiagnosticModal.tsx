import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  Check,
  ShieldCheck,
  Server,
  Key,
  HardDrive,
  Activity,
  CheckCheck,
  Loader2,
  Table,
  Layers,
  ExternalLink
} from 'lucide-react';
import {
  getSupabase,
  isSupabaseConnected,
  getSupabaseCredentials,
  setCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
  getSupabaseTablesStatus,
  TableStatusInfo
} from '../../lib/supabase';
import { getFirebaseConfig, isFirebaseConfigured } from '../../lib/firebase';

interface DatabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export const DatabaseDiagnosticModal: React.FC<DatabaseDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
}) => {
  const [config, setConfig] = useState(getSupabaseCredentials());
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    databaseConnected?: boolean;
    storageConnected?: boolean;
    latencyMs?: number;
    buckets?: string[];
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [tables, setTables] = useState<Record<string, TableStatusInfo>>({});
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Quick config editing
  const [showConfigEdit, setShowConfigEdit] = useState(false);
  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState(config.anonKey || '');
  const [configFeedback, setConfigFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setIsLoadingTables(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      const diag = await getSupabaseTablesStatus();
      if (diag.tables) {
        setTables(diag.tables);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
        databaseConnected: false,
        storageConnected: false,
      });
    } finally {
      setIsTesting(false);
      setIsLoadingTables(false);
    }
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigFeedback(null);
    if (!inputUrl.trim() && !inputKey.trim()) {
      clearCustomSupabaseConfig();
      const fresh = getSupabaseCredentials();
      setConfig(fresh);
      setShowConfigEdit(false);
      handleTestConnection();
      return;
    }
    const res = setCustomSupabaseConfig(inputUrl.trim(), inputKey.trim());
    if (res.success) {
      setConfig(getSupabaseCredentials());
      setConfigFeedback('Configuration updated!');
      setShowConfigEdit(false);
      handleTestConnection();
    } else {
      setConfigFeedback(res.error || 'Failed to save configuration');
    }
  };

  const handleCopySql = async () => {
    try {
      const response = await fetch('/supabase_quick_setup.sql');
      const sql = await response.text();
      await navigator.clipboard.writeText(sql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      setCopiedSql(false);
    }
  };

  if (!isOpen) return null;

  const tableList = Object.values(tables);
  const activeCount = tableList.filter((t) => t.exists).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0c101c] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#111627] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Database Connectivity & Telemetry</span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    testResult?.databaseConnected
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  }`}
                >
                  {testResult?.databaseConnected ? 'Supabase Cloud PostgreSQL' : 'Local IndexedDB Fallback'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Piyush Kumar Portfolio high-availability dual storage engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Firebase Firestore Primary Cloud Database Card */}
          {isFirebaseConfigured() && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className="text-xs font-bold text-white">Firebase Firestore Database</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Primary Cloud Database
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Cloudflare Pages Ready</span>
              </div>
              <div className="text-xs text-slate-300 grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 font-sans text-[10px] block">Project ID:</span>
                  <span className="text-amber-300 truncate block">{getFirebaseConfig()?.projectId}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans text-[10px] block">Database ID:</span>
                  <span className="text-emerald-300 truncate block">{getFirebaseConfig()?.firestoreDatabaseId || '(default)'}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-white/5 flex items-center gap-1.5 font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Live collections: portfolio_data, contact_messages, project_comments, snorlax_ai_interactions</span>
              </div>
            </div>
          )}

          {/* Status Metrics Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#141a2e] border border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Database Ping
              </span>
              <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{testResult?.latencyMs ? `${testResult.latencyMs} ms` : 'Testing...'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141a2e] border border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Storage Bucket
              </span>
              <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">
                  {testResult?.storageConnected ? 'portfolio-assets' : 'Local Blob'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#141a2e] border border-white/5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Tables Live
              </span>
              <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {activeCount} / {tableList.length || 15}
                </span>
              </div>
            </div>
          </div>

          {/* Active Configuration Summary */}
          <div className="p-4 rounded-xl bg-[#141a2e] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span>Endpoint Configuration</span>
              </span>
              <button
                onClick={() => setShowConfigEdit(!showConfigEdit)}
                className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                {showConfigEdit ? 'Hide Settings' : 'Edit Credentials'}
              </button>
            </div>

            <div className="text-xs font-mono text-slate-300 break-all bg-black/40 p-2.5 rounded-lg border border-white/5">
              {config.url ? config.url : 'No Supabase URL provided (Running with IndexedDB failover)'}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>
                Config Source: <strong className="text-white capitalize">{config.source}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Auto-failover active
              </span>
            </div>

            {/* In-Modal Credential Editor */}
            {showConfigEdit && (
              <form onSubmit={handleSaveCustom} className="pt-3 border-t border-white/10 space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Project URL</label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Public Anon Key</label>
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {configFeedback && (
                  <div className="text-xs text-amber-400 font-medium">{configFeedback}</div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
                  >
                    Save & Test
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearCustomSupabaseConfig();
                      setInputUrl('');
                      setInputKey('');
                      setShowConfigEdit(false);
                      handleTestConnection();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white text-xs transition-colors"
                  >
                    Clear Custom
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* 15-Table Status List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>All 15 Database Tables Diagnostics</span>
              </span>
              <button
                onClick={handleTestConnection}
                disabled={isTesting || isLoadingTables}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Retest</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {tableList.map((t) => (
                <div
                  key={t.name}
                  className="p-2.5 rounded-lg bg-[#141a2e] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        t.exists ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span className="truncate text-slate-300 font-medium">{t.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {t.exists ? `${t.count} rows` : 'missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-[#111627] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
            >
              {copiedSql ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL Copied!' : 'Copy Quick Setup SQL'}</span>
            </button>
            <a
              href="/supabase_quick_setup.sql"
              download="supabase_quick_setup.sql"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
              title="Download SQL script"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>

          {onOpenAdmin && (
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              <span>Open Admin Database Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
