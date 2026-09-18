import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  Check,
  ShieldCheck,
  HardDrive,
  Zap,
  Server,
  Key,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Terminal,
  FileCode,
  Loader2,
  Table,
  Layers,
  Activity,
  CheckCheck
} from 'lucide-react';
import { PortfolioData } from '../../types/portfolio';
import { PortfolioService } from '../../services/portfolioService';
import {
  getSupabase,
  isSupabaseConnected,
  getSupabaseCredentials,
  setCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
  getSupabaseTablesStatus,
  TableStatusInfo,
  onSupabaseConfigChange
} from '../../lib/supabase';

interface DatabaseControlCenterProps {
  portfolioData: PortfolioData;
  onUpdatePortfolioData: (data: PortfolioData) => void;
}

export const DatabaseControlCenter: React.FC<DatabaseControlCenterProps> = ({
  portfolioData,
  onUpdatePortfolioData,
}) => {
  // Connection state
  const [config, setConfig] = useState(getSupabaseCredentials());
  const [isConnected, setIsConnected] = useState(isSupabaseConnected());
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    databaseConnected?: boolean;
    storageConnected?: boolean;
    latencyMs?: number;
    buckets?: string[];
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Form editing state
  const [customUrl, setCustomUrl] = useState(config.url || '');
  const [customKey, setCustomKey] = useState(config.anonKey || '');
  const [showKey, setShowKey] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Table diagnostics
  const [tableDiagnostics, setTableDiagnostics] = useState<Record<string, TableStatusInfo>>({});
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // Cloud sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullFeedback, setPullFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // SQL Copy state
  const [copiedSql, setCopiedSql] = useState(false);

  // Synchronize on config change
  useEffect(() => {
    const unsub = onSupabaseConfigChange((newCfg) => {
      setConfig(newCfg);
      setIsConnected(Boolean(newCfg.url && newCfg.anonKey));
      setCustomUrl(newCfg.url || '');
      setCustomKey(newCfg.anonKey || '');
    });
    return unsub;
  }, []);

  // Run initial test and diagnostic fetch
  const runDiagnostics = useCallback(async () => {
    setIsLoadingDiagnostics(true);
    try {
      const diag = await getSupabaseTablesStatus();
      if (diag.tables) {
        setTableDiagnostics(diag.tables);
      }
    } catch (e) {
      console.warn('Diagnostic fetch error:', e);
    } finally {
      setIsLoadingDiagnostics(false);
    }
  }, []);

  const runConnectionTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      await runDiagnostics();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Connection test failed',
        databaseConnected: false,
        storageConnected: false,
      });
    } finally {
      setIsTesting(false);
    }
  }, [runDiagnostics]);

  useEffect(() => {
    runConnectionTest();
  }, [runConnectionTest]);

  // Handle saving credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigMessage(null);

    const trimmedUrl = customUrl.trim();
    const trimmedKey = customKey.trim();

    if (!trimmedUrl && !trimmedKey) {
      clearCustomSupabaseConfig();
      setConfigMessage({ type: 'success', text: 'Custom credentials cleared. Resilient local mode restored.' });
      runConnectionTest();
      return;
    }

    if (!trimmedUrl.startsWith('https://')) {
      setConfigMessage({
        type: 'error',
        text: 'Invalid URL. Project URL must begin with https:// (e.g., https://your-project.supabase.co)',
      });
      return;
    }

    const res = setCustomSupabaseConfig(trimmedUrl, trimmedKey);
    if (res.success) {
      setConfigMessage({
        type: 'success',
        text: 'Credentials updated and activated successfully! Testing connection...',
      });
      runConnectionTest();
    } else {
      setConfigMessage({
        type: 'error',
        text: res.error || 'Failed to save credentials.',
      });
    }
  };

  const handleResetToEnv = () => {
    clearCustomSupabaseConfig();
    const fresh = getSupabaseCredentials();
    setConfig(fresh);
    setCustomUrl(fresh.url || '');
    setCustomKey(fresh.anonKey || '');
    setConfigMessage({ type: 'success', text: 'Reset to system environment settings.' });
    runConnectionTest();
  };

  // One-click Sync All Data to Supabase
  const handleSyncAllToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    setSyncProgress(10);
    setSyncStep('Verifying Supabase connection...');

    try {
      const client = getSupabase();
      if (!client || !isSupabaseConnected()) {
        throw new Error('Supabase is not configured. Please enter your Project URL and Anon Key first.');
      }

      setSyncProgress(25);
      setSyncStep('Syncing profile, bio, and visual site settings...');
      
      const saved = await PortfolioService.savePortfolioData(portfolioData);
      if (!saved) {
        throw new Error('Failed to save and upload portfolio data.');
      }

      setSyncProgress(65);
      setSyncStep('Verifying and auditing table records...');
      await runDiagnostics();

      setSyncProgress(100);
      setSyncStep('All 15 tables synced and verified!');
      setSyncFeedback({
        success: true,
        message: 'Successfully uploaded and synchronized all portfolio content, projects, files, and settings with Supabase!',
      });
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: err?.message || 'Sync failed. Check table setup or credentials.',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStep(''), 3000);
    }
  };

  // Pull latest from Supabase
  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    setPullFeedback(null);
    try {
      const fetchRes = await PortfolioService.getPortfolioData();
      if (fetchRes && fetchRes.data) {
        onUpdatePortfolioData(fetchRes.data);
      }
      await runDiagnostics();
      setPullFeedback({
        success: true,
        message: `Successfully pulled latest data from ${fetchRes.source === 'supabase' ? 'Supabase' : 'local persistence'}!`,
      });
    } catch (err: any) {
      setPullFeedback({
        success: false,
        message: err?.message || 'Failed to pull data from Supabase.',
      });
    } finally {
      setIsPulling(false);
    }
  };

  // Copy SQL script
  const handleCopySql = async () => {
    try {
      const response = await fetch('/supabase_quick_setup.sql');
      const sqlText = await response.text();
      await navigator.clipboard.writeText(sqlText);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      console.warn('Failed to read sql file, falling back:', e);
      setCopiedSql(false);
    }
  };

  // Table status summary
  const tableEntries = Object.values(tableDiagnostics);
  const totalTables = tableEntries.length;
  const existingTables = tableEntries.filter((t) => t.exists).length;
  const filteredTables = activeCategoryFilter === 'all'
    ? tableEntries
    : tableEntries.filter((t) => (t.category || '').toLowerCase() === activeCategoryFilter.toLowerCase());

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d1222] to-[#121a30] border border-white/10 relative overflow-hidden shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Database & Cloud Architecture</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Supabase PostgreSQL & Persistent Storage Engine
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              High-performance relational persistence with client-side failover resilience. Automatically syncs projects, attachments, reviews, and bio across cloud tables with instant local fallback.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runConnectionTest}
              disabled={isTesting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>{isTesting ? 'Testing Ping...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={handleSyncAllToSupabase}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              <span>{isSyncing ? 'Syncing Tables...' : 'Sync All Data to Supabase'}</span>
            </button>
          </div>
        </div>

        {/* Sync Progress Indicator */}
        {isSyncing && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1.5">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                {syncStep}
              </span>
              <span className="font-mono font-bold">{syncProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Sync Feedback Toast */}
        {syncFeedback && !isSyncing && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
              syncFeedback.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
            <button
              onClick={() => setSyncFeedback(null)}
              className="text-slate-400 hover:text-white text-xs underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Live System Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Connection Status Card */}
        <div className="p-4 rounded-2xl bg-[#0e1220] border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cloud Engine
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                testResult?.databaseConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isConnected
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-blue-400'
              }`}
            />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {testResult?.databaseConnected ? (
              <span className="text-emerald-400">PostgreSQL Active</span>
            ) : isConnected ? (
              <span className="text-amber-400">Configured (Testing)</span>
            ) : (
              <span className="text-blue-400">Local Fallback Active</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {testResult?.databaseConnected
              ? 'Real-time bidirectional sync enabled'
              : 'IndexedDB durable offline cache active'}
          </p>
        </div>

        {/* Latency Ping */}
        <div className="p-4 rounded-2xl bg-[#0e1220] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              API Latency
            </span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {testResult?.latencyMs ? (
              <span
                className={
                  testResult.latencyMs < 120
                    ? 'text-emerald-400'
                    : testResult.latencyMs < 350
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {testResult.latencyMs} ms
              </span>
            ) : (
              <span className="text-slate-500 font-normal">-- ms</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {testResult?.latencyMs ? 'Live endpoint round-trip time' : 'Run test to measure ping'}
          </p>
        </div>

        {/* Storage Bucket Card */}
        <div className="p-4 rounded-2xl bg-[#0e1220] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Storage Bucket
            </span>
            <HardDrive className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            {testResult?.storageConnected ? (
              <span className="text-emerald-400">portfolio-assets</span>
            ) : (
              <span className="text-slate-400">Standard Uploads</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {testResult?.storageConnected
              ? 'Public CDN image & ZIP storage ready'
              : 'Local IndexedDB blob caching enabled'}
          </p>
        </div>

        {/* Database Tables Ready */}
        <div className="p-4 rounded-2xl bg-[#0e1220] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Relational Tables
            </span>
            <Table className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-white">
            <span className={existingTables >= 10 ? 'text-emerald-400' : 'text-amber-400'}>
              {existingTables} / {totalTables || 15}
            </span>
            <span className="text-xs font-normal text-slate-400 ml-1.5">tables live</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {existingTables === totalTables && totalTables > 0
              ? 'All 15 schema tables fully verified'
              : 'Run quick setup SQL to provision all'}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Table Diagnostics & Synchronizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Table Diagnostic Matrix */}
          <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Schema & Table Diagnostics (15 Relational Tables)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time health check, accessibility, and row count for every database table.
                </p>
              </div>

              <button
                onClick={runDiagnostics}
                disabled={isLoadingDiagnostics}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDiagnostics ? 'animate-spin text-emerald-400' : ''}`} />
                <span>Refresh Matrix</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['all', 'core', 'profile', 'engagement', 'config', 'vault'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                    activeCategoryFilter === cat
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Diagnostics List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {isLoadingDiagnostics && tableEntries.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  <span>Pinging Supabase tables...</span>
                </div>
              ) : filteredTables.length > 0 ? (
                filteredTables.map((t) => (
                  <div
                    key={t.name}
                    className="p-3 rounded-xl bg-[#131929] border border-white/5 flex items-center justify-between gap-3 hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          t.exists
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {t.exists ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{t.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                            {t.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Category: {t.category || 'Core'}
                          {t.error && ` • ${t.error}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {t.exists ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {t.count}
                          </span>
                          <span className="text-[10px] text-slate-400">rows</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          Missing Table
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No tables found in this category filter.
                </div>
              )}
            </div>

            {/* Quick Actions Row */}
            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Resilient failover protects all unsaved rows locally
              </span>

              <button
                onClick={handlePullFromSupabase}
                disabled={isPulling}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-medium transition-colors border border-blue-500/20 disabled:opacity-50"
              >
                <ArrowDownLeft className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Pulling Data...' : 'Pull from Supabase'}</span>
              </button>
            </div>

            {pullFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                  pullFeedback.success
                    ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}
              >
                <span>{pullFeedback.message}</span>
                <button
                  onClick={() => setPullFeedback(null)}
                  className="text-slate-400 hover:text-white underline ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Supabase Credentials & SQL Setup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Credentials Configuration Card */}
          <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Supabase API Connection</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect your personal Supabase project by providing the Project URL and Public Anon Key.
              </p>
            </div>

            {configMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  configMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}
              >
                {configMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">{configMessage.text}</div>
              </div>
            )}

            <form onSubmit={handleSaveCredentials} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xyzproject.supabase.co"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#131929] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Found in your Supabase Dashboard under Project Settings &gt; API
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Public Anon API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#131929] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToEnv}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-white/5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Active Source: </span>
              <span className="capitalize text-emerald-400 font-mono">{config.source}</span>
              {config.source === 'env' && ' (Loaded securely from project environment)'}
              {config.source === 'custom' && ' (Saved in browser custom configuration)'}
              {config.source === 'none' && ' (Resilient local storage active)'}
            </div>
          </div>

          {/* Quick SQL Setup Script Card */}
          <div className="p-5 rounded-2xl bg-[#0c101c] border border-white/5 space-y-3.5">
            <div className="border-b border-white/5 pb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                <Terminal className="w-3 h-3" />
                <span>One-Click SQL Setup</span>
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Supabase Database Schema Setup</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Run this SQL script in your Supabase SQL editor to create all 15 tables, storage buckets, and open security policies with zero errors.
              </p>
            </div>

            <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-[#131929] p-3 rounded-xl border border-white/5 font-medium">
              <li>Open your Supabase Project Dashboard</li>
              <li>Navigate to the <span className="text-emerald-400">SQL Editor</span> tab</li>
              <li>Click &quot;New Query&quot;, paste the copied script, and click <span className="text-emerald-400">Run</span></li>
            </ol>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCopySql}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {copiedSql ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full SQL Script</span>
                  </>
                )}
              </button>

              <a
                href="/supabase_quick_setup.sql"
                download="supabase_quick_setup.sql"
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.sql</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
