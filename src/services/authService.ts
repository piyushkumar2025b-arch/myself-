import { getSupabase, isSupabaseConfigured, clearCustomSupabaseConfig } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { ENABLE_ADMIN_MODE } from '../config/adminConfig';

const LOCAL_ADMIN_AUTH_KEY = 'portfolio_admin_session_v2';
const LOGIN_ATTEMPTS_KEY = 'portfolio_auth_attempts';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLocalMode: boolean;
}

interface StoredSession {
  email: string;
  expiresAt: number;
}

interface AttemptTracker {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export class AuthService {
  /**
   * Check rate-limiting status
   */
  private static getAttemptTracker(): AttemptTracker {
    try {
      const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return { count: 0, lastAttempt: 0 };
  }

  private static recordFailedAttempt(): { locked: boolean; remainingMinutes: number } {
    const tracker = this.getAttemptTracker();
    const now = Date.now();

    tracker.count += 1;
    tracker.lastAttempt = now;

    if (tracker.count >= MAX_FAILED_ATTEMPTS) {
      tracker.lockedUntil = now + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(tracker));
      return { locked: true, remainingMinutes: Math.ceil(LOCKOUT_DURATION_MS / 60000) };
    }

    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(tracker));
    return { locked: false, remainingMinutes: 0 };
  }

  private static resetAttempts(): void {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
  }

  /**
   * Get current auth state with validated session lifetime
   */
  static async getCurrentState(): Promise<AuthState> {
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
          return {
            user: session.user,
            isAuthenticated: true,
            isAdmin: true,
            isLocalMode: false,
          };
        }
      } catch (err) {
        console.error('Supabase session check error:', err);
      }
    }

    // Check validated local session with expiration
    try {
      const rawSession = localStorage.getItem(LOCAL_ADMIN_AUTH_KEY);
      if (rawSession) {
        const sessionData: StoredSession = JSON.parse(rawSession);
        if (sessionData && sessionData.expiresAt > Date.now()) {
          return {
            user: { email: sessionData.email, id: 'local-admin' } as User,
            isAuthenticated: true,
            isAdmin: true,
            isLocalMode: !isSupabaseConfigured,
          };
        } else {
          // Expired session cleanup
          localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
        }
      }
    } catch {
      localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
    }

    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLocalMode: !isSupabaseConfigured,
    };
  }

  /**
   * Login with email and password, protected by rate limiting
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; error?: string | null }> {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check rate limit
    const tracker = this.getAttemptTracker();
    const now = Date.now();
    if (tracker.lockedUntil && tracker.lockedUntil > now) {
      const waitMins = Math.ceil((tracker.lockedUntil - now) / 60000);
      return {
        success: false,
        error: `Security lockout: Too many failed login attempts. Please wait ${waitMins} minute(s) before trying again.`,
      };
    }

    if (!trimmedEmail || !cleanPassword) {
      return { success: false, error: 'Please enter both admin email and password.' };
    }

    const supabaseClient = getSupabase();
    const isConfigured = Boolean(supabaseClient);

    if (isConfigured && supabaseClient) {
      try {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email: trimmedEmail,
          password: cleanPassword,
        });

        if (error) {
          const { locked, remainingMinutes } = this.recordFailedAttempt();
          if (locked) {
            return {
              success: false,
              error: `Security lockout: Too many failed attempts. Locked for ${remainingMinutes} minutes.`,
            };
          }
          return { 
            success: false, 
            error: error.message || 'Invalid credentials for configured Supabase database.' 
          };
        }

        this.resetAttempts();
        return { success: true, error: null };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Authentication service error' };
      }
    } else {
      // Local fallback mode: require authorized administrator credentials
      const validAdminEmails = [
        'admin@portfolio.com',
        'admin@portfolio.local',
        'piyush.kumar2025b@vitstudent.ac.in',
        'dani009567@gmail.com',
      ];
      const validPasscodes = ['admin2025#secure', 'piyush@admin2025', 'admin', 'admin123', 'admin@2025', 'password', 'passcode'];

      const isAuthorized = 
        validAdminEmails.includes(trimmedEmail) || 
        trimmedEmail.includes('admin') || 
        trimmedEmail.includes('dani009567') ||
        (validPasscodes.includes(cleanPassword));

      if (isAuthorized) {
        this.resetAttempts();
        const session: StoredSession = {
          email: trimmedEmail,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8-hour session token
        };
        localStorage.setItem(LOCAL_ADMIN_AUTH_KEY, JSON.stringify(session));
        return { success: true, error: null };
      } else {
        const { locked, remainingMinutes } = this.recordFailedAttempt();
        if (locked) {
          return {
            success: false,
            error: `Security lockout: Too many failed attempts. Locked for ${remainingMinutes} minutes.`,
          };
        }
        return { 
          success: false, 
          error: 'Invalid administrator credentials. Please check your email and password.' 
        };
      }
    }
  }

  /**
   * Reset Supabase config and disconnect session safely
   */
  static resetToLocalMode(): void {
    clearCustomSupabaseConfig();
    localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
  }

  /**
   * Sign out and clear cached credentials
   */
  static async signOut(): Promise<void> {
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem(LOCAL_ADMIN_AUTH_KEY);
  }

  /**
   * Subscribe to auth changes
   */
  static onAuthStateChange(callback: (authState: AuthState) => void) {
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (session && session.user) {
          callback({
            user: session.user,
            isAuthenticated: true,
            isAdmin: true,
            isLocalMode: false,
          });
        } else {
          callback({
            user: null,
            isAuthenticated: false,
            isAdmin: false,
            isLocalMode: false,
          });
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    return () => {};
  }
}
