import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_STORAGE_KEY = 'supabase_custom_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  source: 'env' | 'custom' | 'none';
}

/**
 * Retrieves current Supabase credentials from custom localStorage or environment variables
 */
export function getSupabaseCredentials(): SupabaseConfig {
  const env = (import.meta as any).env || {};
  const envUrl = env.VITE_SUPABASE_URL as string | undefined;
  const envKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

  // 1. Check custom saved credentials in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(SUPABASE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.url && parsed.anonKey && isValidUrl(parsed.url)) {
          return {
            url: parsed.url.trim(),
            anonKey: parsed.anonKey.trim(),
            source: 'custom',
          };
        }
      }
    }
  } catch (err) {
    console.warn('Error reading stored Supabase config:', err);
  }

  // 2. Check environment variables
  if (
    envUrl && 
    envKey && 
    envUrl.trim() !== '' && 
    envKey.trim() !== '' &&
    !envUrl.includes('placeholder') &&
    !envUrl.includes('your-project')
  ) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      source: 'env',
    };
  }

  return {
    url: '',
    anonKey: '',
    source: 'none',
  };
}

function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

let activeClient: SupabaseClient | null = null;
let currentConfig = getSupabaseCredentials();

type ConfigChangeListener = (config: SupabaseConfig) => void;
const configListeners = new Set<ConfigChangeListener>();

export function onSupabaseConfigChange(listener: ConfigChangeListener): () => void {
  configListeners.add(listener);
  return () => configListeners.delete(listener);
}

function notifyConfigListeners() {
  const cfg = getSupabaseCredentials();
  configListeners.forEach((fn) => {
    try {
      fn(cfg);
    } catch (e) {
      console.warn('Error in config listener:', e);
    }
  });
}

function initClient(): SupabaseClient | null {
  currentConfig = getSupabaseCredentials();
  if (currentConfig.url && currentConfig.anonKey) {
    try {
      activeClient = createClient(currentConfig.url, currentConfig.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return activeClient;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      activeClient = null;
      return null;
    }
  }
  activeClient = null;
  return null;
}

// Initial client instance
initClient();

/**
 * Get active Supabase client or re-initialize
 */
export function getSupabase(): SupabaseClient | null {
  if (!activeClient) {
    return initClient();
  }
  return activeClient;
}

export const supabase: SupabaseClient | null = activeClient;

export function isSupabaseConnected(): boolean {
  const cfg = getSupabaseCredentials();
  return Boolean(cfg.url && cfg.anonKey);
}

export function getIsSupabaseConfigured(): boolean {
  return isSupabaseConnected();
}

export let isSupabaseConfigured = isSupabaseConnected();

/**
 * Save and apply custom Supabase credentials
 */
export function setCustomSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    if (!url || !anonKey) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SUPABASE_STORAGE_KEY);
      }
      initClient();
      isSupabaseConfigured = isSupabaseConnected();
      notifyConfigListeners();
      return { success: true };
    }

    if (!isValidUrl(url)) {
      return { success: false, error: 'Invalid Supabase Project URL. Example: https://xyzcompany.supabase.co' };
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        SUPABASE_STORAGE_KEY,
        JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
      );
    }

    initClient();
    isSupabaseConfigured = isSupabaseConnected();
    notifyConfigListeners();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save configuration' };
  }
}

/**
 * Clear custom Supabase credentials
 */
export function clearCustomSupabaseConfig(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SUPABASE_STORAGE_KEY);
    }
  } catch {}
  initClient();
  isSupabaseConfigured = isSupabaseConnected();
  notifyConfigListeners();
}

/**
 * Test Supabase connection and Storage bucket availability with latency check
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  databaseConnected?: boolean;
  storageConnected?: boolean;
  latencyMs?: number;
  buckets?: string[];
}> {
  const client = getSupabase();
  if (!client || !isSupabaseConnected()) {
    return {
      success: false,
      message: 'Supabase credentials are not configured in environment or settings.',
      databaseConnected: false,
      storageConnected: false,
    };
  }

  const startTime = Date.now();
  try {
    // 1. Test database ping via contact_messages or profiles
    let dbSuccess = false;
    try {
      const { error: msgErr } = await client.from('contact_messages').select('id').limit(1);
      if (!msgErr) {
        dbSuccess = true;
      } else {
        const { error: profErr } = await client.from('profiles').select('id').limit(1);
        if (!profErr) dbSuccess = true;
      }
    } catch {
      dbSuccess = false;
    }

    // 2. Test storage buckets
    let storageSuccess = false;
    let bucketNames: string[] = [];
    try {
      const { data: bucketsData, error: storageError } = await client.storage.listBuckets();
      if (!storageError && bucketsData) {
        storageSuccess = true;
        bucketNames = bucketsData.map(b => b.name) || [];
      }
    } catch {
      storageSuccess = false;
    }

    const latencyMs = Date.now() - startTime;

    if (!dbSuccess && !storageSuccess) {
      return {
        success: false,
        message: 'Could not reach Supabase Database or Storage endpoints.',
        databaseConnected: false,
        storageConnected: false,
        latencyMs,
      };
    }

    return {
      success: true,
      message: dbSuccess && storageSuccess 
        ? `Supabase Database & Storage fully connected (${latencyMs}ms)!`
        : dbSuccess 
          ? `Supabase Database connected (${latencyMs}ms)`
          : `Supabase Storage connected (${latencyMs}ms)`,
      databaseConnected: dbSuccess,
      storageConnected: storageSuccess,
      latencyMs,
      buckets: bucketNames,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      message: err?.message || 'Failed to connect to Supabase.',
      databaseConnected: false,
      storageConnected: false,
      latencyMs,
    };
  }
}

export interface TableStatusInfo {
  name: string;
  label: string;
  category?: string;
  exists: boolean;
  count: number;
  error?: string;
}

/**
 * Live diagnostic check for each table in Supabase
 */
export async function getSupabaseTablesStatus(): Promise<{
  connected: boolean;
  tables: Record<string, TableStatusInfo>;
  error?: string;
}> {
  const client = getSupabase();
  if (!client || !isSupabaseConnected()) {
    return {
      connected: false,
      tables: {},
      error: 'Supabase client is not configured.',
    };
  }

  const tableList: { name: string; label: string; category: string }[] = [
    { name: 'profiles', label: 'Profiles & Bio', category: 'Core' },
    { name: 'projects', label: 'Projects Showcase', category: 'Core' },
    { name: 'project_files', label: 'Project Attachments', category: 'Core' },
    { name: 'project_comments', label: 'Project Comments', category: 'Engagement' },
    { name: 'skills', label: 'Skills & Tech Stack', category: 'Profile' },
    { name: 'services', label: 'Professional Services', category: 'Profile' },
    { name: 'experiences', label: 'Work Experiences', category: 'Profile' },
    { name: 'education', label: 'Education History', category: 'Profile' },
    { name: 'research', label: 'Research & Papers', category: 'Profile' },
    { name: 'achievements', label: 'Awards & Honors', category: 'Profile' },
    { name: 'navigation', label: 'Navigation Links', category: 'Config' },
    { name: 'social_links', label: 'Social Profiles', category: 'Config' },
    { name: 'site_settings', label: 'Site & 3D Settings', category: 'Config' },
    { name: 'contact_messages', label: 'Contact Messages', category: 'Engagement' },
    { name: 'public_documents', label: 'Public Documents Vault', category: 'Vault' },
  ];

  const results: Record<string, TableStatusInfo> = {};

  await Promise.all(
    tableList.map(async (t) => {
      try {
        const { count, error } = await client
          .from(t.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results[t.name] = {
            name: t.name,
            label: t.label,
            category: t.category,
            exists: false,
            count: 0,
            error: error.message,
          };
        } else {
          results[t.name] = {
            name: t.name,
            label: t.label,
            category: t.category,
            exists: true,
            count: count ?? 0,
          };
        }
      } catch (err: any) {
        results[t.name] = {
          name: t.name,
          label: t.label,
          category: t.category,
          exists: false,
          count: 0,
          error: err?.message || 'Query failed',
        };
      }
    })
  );

  return {
    connected: true,
    tables: results,
  };
}

/**
 * Helper to log configuration status in development
 */
export function logSupabaseStatus(): void {
  const cfg = getSupabaseCredentials();
  if (cfg.url) {
    console.info(`[Supabase] Active (${cfg.source}): ${cfg.url}`);
  } else {
    console.info('[Supabase] Credentials not found. Operating with resilient local fallback.');
  }
}

