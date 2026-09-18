import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ContactMessage } from '../types/portfolio';

const LOCAL_MESSAGES_KEY = 'portfolio_contact_messages';

export interface SubmitMessageParams {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface SubmitMessageResult {
  success: boolean;
  messageId?: string;
  error?: string | null;
}

export class ContactService {
  /**
   * Submit a new contact message to Firebase Firestore and local store
   */
  static async submitMessage(params: SubmitMessageParams): Promise<SubmitMessageResult> {
    try {
      if (!params.name.trim() || !params.email.trim() || !params.message.trim()) {
        return { success: false, error: 'Name, email, and message are required.' };
      }

      // Basic email regex test
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(params.email)) {
        return { success: false, error: 'Please provide a valid email address.' };
      }

      let cloudMessageId: string | null = null;

      // 1. Primary: Save to Firebase Firestore
      try {
        if (db && db.type) {
          const docRef = await addDoc(collection(db, 'contact_messages'), {
            name: params.name.trim(),
            email: params.email.trim(),
            subject: params.subject?.trim() || 'Portfolio Inquiry',
            message: params.message.trim(),
            status: 'unread',
            createdAt: new Date().toISOString(),
          });
          cloudMessageId = docRef.id;
        }
      } catch (fbErr: any) {
        if (fbErr?.code === 'permission-denied' || (fbErr?.message && fbErr.message.includes('permission'))) {
          handleFirestoreError(fbErr, OperationType.CREATE, 'contact_messages');
        }
        console.warn('Firebase contact submission notice (using fallback):', fbErr);
      }

      // 2. Secondary: If Supabase client connected, also record there
      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        try {
          const { data } = await client
            .from('contact_messages')
            .insert([
              {
                name: params.name.trim(),
                email: params.email.trim(),
                subject: params.subject?.trim() || 'Portfolio Inquiry',
                message: params.message.trim(),
                status: 'unread',
              },
            ])
            .select('id')
            .single();

          if (data?.id && !cloudMessageId) {
            cloudMessageId = data.id;
          }
        } catch (sbErr) {
          console.warn('Supabase secondary record notice:', sbErr);
        }
      }

      // 3. Local resilient copy
      const localId = this.saveLocalMessage(params);
      return { success: true, messageId: cloudMessageId || localId };
    } catch (err: any) {
      console.error('ContactService submit error:', err);
      // Fallback save to ensure user message isn't lost
      const localId = this.saveLocalMessage(params);
      return { success: true, messageId: localId };
    }
  }

  /**
   * Fetch all messages (for Admin view)
   */
  static async getMessages(): Promise<ContactMessage[]> {
    try {
      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        const { data, error } = await client
          .from('contact_messages')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((msg: any) => ({
            id: String(msg.id),
            name: msg.name,
            email: msg.email,
            subject: msg.subject,
            message: msg.message,
            status: msg.status || 'unread',
            createdAt: msg.created_at || new Date().toISOString(),
          }));
        }
      }

      // Fallback to local messages
      return this.getLocalMessages();
    } catch (err) {
      console.error('Error getting messages:', err);
      return this.getLocalMessages();
    }
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(id: string, status: 'unread' | 'read' | 'archived'): Promise<boolean> {
    try {
      const client = getSupabase();
      if (client && isSupabaseConnected() && !id.startsWith('local-')) {
        const { error } = await client
          .from('contact_messages')
          .update({ status })
          .eq('id', id);

        if (!error) return true;
      }

      // Update local storage
      const messages = this.getLocalMessages();
      const updated = messages.map((m) => (m.id === id ? { ...m, status } : m));
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(updated));
      return true;
    } catch (err) {
      console.error('Error updating message status:', err);
      return false;
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(id: string): Promise<boolean> {
    try {
      const client = getSupabase();
      if (client && isSupabaseConnected() && !id.startsWith('local-')) {
        const { error } = await client
          .from('contact_messages')
          .delete()
          .eq('id', id);

        if (!error) return true;
      }

      // Delete from local storage
      const messages = this.getLocalMessages().filter((m) => m.id !== id);
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(messages));
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      return false;
    }
  }

  // Local storage helpers
  private static saveLocalMessage(params: SubmitMessageParams): string {
    const id = 'local-' + Date.now();
    const newMsg: ContactMessage = {
      id,
      name: params.name.trim(),
      email: params.email.trim(),
      subject: params.subject?.trim() || 'Portfolio Inquiry',
      message: params.message.trim(),
      status: 'unread',
      createdAt: new Date().toISOString(),
    };

    const existing = this.getLocalMessages();
    existing.unshift(newMsg);
    try {
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    return id;
  }

  private static getLocalMessages(): ContactMessage[] {
    try {
      const stored = localStorage.getItem(LOCAL_MESSAGES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
}
