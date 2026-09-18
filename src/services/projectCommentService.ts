import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ProjectComment, CommentStatus } from '../types/portfolio';
import { idbGet, idbSet } from './persistentStorage';

const LOCAL_COMMENTS_KEY = 'portfolio_project_comments_v1';

export class ProjectCommentService {
  /**
   * Submit a new public comment (defaults to 'pending' moderation status)
   */
  static async submitComment(
    projectId: string,
    authorName: string,
    authorEmail: string,
    commentText: string
  ): Promise<{ success: boolean; comment?: ProjectComment; message?: string; error?: string }> {
    try {
      if (!projectId) return { success: false, error: 'Project ID is required' };
      
      const cleanName = (authorName || '').trim();
      const cleanEmail = (authorEmail || '').trim().toLowerCase();
      const cleanText = (commentText || '').trim();

      // Input Validation
      if (!cleanName || cleanName.length < 2) {
        return { success: false, error: 'Please provide your name (at least 2 characters).' };
      }
      if (cleanName.length > 60) {
        return { success: false, error: 'Name cannot exceed 60 characters.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      if (!cleanText || cleanText.length < 3) {
        return { success: false, error: 'Comment must be at least 3 characters long.' };
      }
      if (cleanText.length > 2000) {
        return { success: false, error: 'Comment cannot exceed 2000 characters.' };
      }

      const newComment: ProjectComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        projectId,
        authorName: cleanName,
        authorEmail: cleanEmail,
        comment: cleanText,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // 1. Write to Firebase Firestore
      try {
        if (db && db.type) {
          await setDoc(doc(collection(db, 'project_comments'), newComment.id), {
            projectId: newComment.projectId,
            authorName: newComment.authorName,
            authorEmail: newComment.authorEmail,
            comment: newComment.comment,
            status: newComment.status,
            createdAt: newComment.createdAt,
          });
        }
      } catch (fbErr: any) {
        if (fbErr?.code === 'permission-denied' || (fbErr?.message && fbErr.message.includes('permission'))) {
          handleFirestoreError(fbErr, OperationType.CREATE, 'project_comments');
        }
        console.warn('Firebase comment insert notice:', fbErr);
      }

      // 2. Secondary: If Supabase connected, also insert
      const client = getSupabase();
      if (client && isSupabaseConnected()) {
        try {
          const { error } = await client.from('project_comments').insert({
            id: newComment.id,
            project_id: newComment.projectId,
            author_name: newComment.authorName,
            author_email: newComment.authorEmail,
            comment: newComment.comment,
            status: newComment.status,
            created_at: newComment.createdAt,
          });

          if (error) {
            console.warn('Supabase comment insert note:', error.message);
          }
        } catch (dbErr) {
          console.warn('Supabase comment DB exception:', dbErr);
        }
      }

      // Also persist to local IndexedDB for fallback
      try {
        const stored = (await idbGet<ProjectComment[]>(LOCAL_COMMENTS_KEY)) || [];
        stored.unshift(newComment);
        await idbSet(LOCAL_COMMENTS_KEY, stored);
      } catch (idbErr) {
        console.warn('IDB comment save warning:', idbErr);
      }

      return {
        success: true,
        comment: newComment,
        message: 'Thank you! Your comment has been submitted and is awaiting moderation.',
      };
    } catch (err: any) {
      console.error('ProjectCommentService.submitComment error:', err);
      return { success: false, error: err?.message || 'Failed to submit comment' };
    }
  }

  /**
   * Fetch approved comments for public project viewers (Emails are strictly stripped)
   */
  static async getApprovedComments(projectId: string): Promise<ProjectComment[]> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client
          .from('project_comments')
          .select('id, project_id, author_name, comment, status, created_at')
          .eq('project_id', projectId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            projectId: row.project_id,
            authorName: row.author_name,
            authorEmail: '', // Protected: sanitized from public exposure
            comment: row.comment,
            status: row.status as CommentStatus,
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase get approved comments exception:', err);
      }
    }

    // Local IndexedDB fallback
    try {
      const stored = (await idbGet<ProjectComment[]>(LOCAL_COMMENTS_KEY)) || [];
      return stored
        .filter((c) => c.projectId === projectId && c.status === 'approved')
        .map((c) => ({ ...c, authorEmail: '' }));
    } catch {
      return [];
    }
  }

  /**
   * Admin: Get all comments for a project or all projects with email info for moderation
   */
  static async getAllComments(projectId?: string): Promise<ProjectComment[]> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        let query = client.from('project_comments').select('*');
        if (projectId) {
          query = query.eq('project_id', projectId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            projectId: row.project_id,
            authorName: row.author_name,
            authorEmail: row.author_email || '',
            comment: row.comment,
            status: row.status as CommentStatus,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getAllComments exception:', err);
      }
    }

    // Local IndexedDB fallback
    try {
      const stored = (await idbGet<ProjectComment[]>(LOCAL_COMMENTS_KEY)) || [];
      if (projectId) {
        return stored.filter((c) => c.projectId === projectId);
      }
      return stored;
    } catch {
      return [];
    }
  }

  /**
   * Admin: Moderate comment status (approve, reject, spam)
   */
  static async updateCommentStatus(commentId: string, status: CommentStatus): Promise<boolean> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client
          .from('project_comments')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', commentId);
      } catch (err) {
        console.warn('Supabase updateCommentStatus exception:', err);
      }
    }

    // Update local IDB
    try {
      const stored = (await idbGet<ProjectComment[]>(LOCAL_COMMENTS_KEY)) || [];
      const updated = stored.map((c) => (c.id === commentId ? { ...c, status } : c));
      await idbSet(LOCAL_COMMENTS_KEY, updated);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Admin: Permanently delete a comment
   */
  static async deleteComment(commentId: string): Promise<boolean> {
    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        await client.from('project_comments').delete().eq('id', commentId);
      } catch (err) {
        console.warn('Supabase deleteComment exception:', err);
      }
    }

    // Update local IDB
    try {
      const stored = (await idbGet<ProjectComment[]>(LOCAL_COMMENTS_KEY)) || [];
      const filtered = stored.filter((c) => c.id !== commentId);
      await idbSet(LOCAL_COMMENTS_KEY, filtered);
      return true;
    } catch {
      return false;
    }
  }
}
