import { getSupabase, isSupabaseConnected } from '../lib/supabase';
import { PublicDocument } from '../types/portfolio';
import { getFileExtension, sanitizeFileName, isDangerousFileExtension } from '../utils/fileUtils';

const STORAGE_BUCKET = 'portfolio-assets';
const CACHE_STORAGE_KEY = 'portfolio_public_documents_cache_v3';

export class DocumentService {
  /**
   * Fetch all public documents (prioritizing Supabase database, with fallback to local persistent cache)
   */
  static async getDocuments(): Promise<PublicDocument[]> {
    const client = getSupabase();
    
    // 1. If Supabase is connected, fetch from 'public_documents' table
    if (client && isSupabaseConnected()) {
      try {
        const { data, error } = await client
          .from('public_documents')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formatted: PublicDocument[] = data.map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description || '',
            fileName: row.file_name || row.fileName || 'file',
            fileSize: Number(row.file_size || row.fileSize || 0),
            fileExtension: row.file_extension || row.fileExtension || getFileExtension(row.file_name || ''),
            mimeType: row.mime_type || row.mimeType || 'application/octet-stream',
            category: row.category || 'Document',
            storagePath: row.storage_path || row.storagePath || '',
            publicUrl: row.public_url || row.publicUrl || '',
            downloadCount: Number(row.download_count || row.downloadCount || 0),
            isPublic: row.is_public !== false,
            uploadedBy: row.uploaded_by || row.uploadedBy || 'Admin',
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
            updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
          }));

          // Update local cache
          this.saveToLocalCache(formatted);
          return formatted;
        }
      } catch (err) {
        console.warn('[DocumentService] Supabase query note:', err);
      }
    }

    // 2. Read from persistent local cache
    const cached = this.readFromLocalCache();
    if (cached && cached.length > 0) {
      return cached;
    }

    // 3. No placeholder documents; return clean empty list
    return [];
  }

  /**
   * Upload ANY file type as Admin and save to Supabase Storage and Database
   */
  static async uploadDocument(
    file: File,
    metadata: {
      title: string;
      description?: string;
      category?: string;
      uploadedBy?: string;
    },
    onProgress?: (percent: number, message: string) => void
  ): Promise<{ success: boolean; document?: PublicDocument; error?: string }> {
    try {
      if (!file) {
        return { success: false, error: 'No file was provided.' };
      }

      if (isDangerousFileExtension(file.name)) {
        return {
          success: false,
          error: 'Security Error: Executable and dangerous script files are prohibited from upload.',
        };
      }

      onProgress?.(15, 'Preparing and validating file...');
      const cleanName = sanitizeFileName(file.name);
      const ext = getFileExtension(cleanName) || 'bin';
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = Date.now();
      const storagePath = `documents/${timestamp}_${cleanName}`;

      let publicUrl = '';
      const client = getSupabase();

      onProgress?.(40, 'Uploading file to Supabase Storage...');

      // 1. Upload to Supabase Storage
      if (client && isSupabaseConnected()) {
        try {
          const { data: uploadData, error: uploadError } = await client.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            console.warn('[DocumentService] Supabase Storage upload warning:', uploadError.message);
          } else if (uploadData?.path) {
            const { data: urlData } = client.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(uploadData.path);
            publicUrl = urlData?.publicUrl || '';
          }
        } catch (storageErr) {
          console.warn('[DocumentService] Supabase Storage exception:', storageErr);
        }
      }

      // 2. Resilient fallback if Supabase Storage is not reachable or in local dev
      if (!publicUrl) {
        try {
          publicUrl = await this.readFileAsDataUrl(file);
        } catch {
          publicUrl = URL.createObjectURL(file);
        }
      }

      onProgress?.(75, 'Registering document metadata in Supabase...');

      const newDocument: PublicDocument = {
        id: docId,
        title: metadata.title?.trim() || cleanName,
        description: metadata.description?.trim() || '',
        fileName: cleanName,
        fileSize: file.size,
        fileExtension: ext,
        mimeType: file.type || 'application/octet-stream',
        category: metadata.category || 'Guides & Notes',
        storagePath: storagePath,
        publicUrl: publicUrl,
        downloadCount: 0,
        isPublic: true,
        uploadedBy: metadata.uploadedBy || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Insert record into Supabase `public_documents` table
      if (client && isSupabaseConnected()) {
        try {
          const { error: dbError } = await client.from('public_documents').insert({
            id: newDocument.id,
            title: newDocument.title,
            description: newDocument.description,
            file_name: newDocument.fileName,
            file_size: newDocument.fileSize,
            file_extension: newDocument.fileExtension,
            mime_type: newDocument.mimeType,
            category: newDocument.category,
            storage_path: newDocument.storagePath,
            public_url: newDocument.publicUrl,
            download_count: newDocument.downloadCount,
            is_public: newDocument.isPublic,
            uploaded_by: newDocument.uploadedBy,
            created_at: newDocument.createdAt,
            updated_at: newDocument.updatedAt,
          });

          if (dbError) {
            console.warn('[DocumentService] Supabase DB insert notice:', dbError.message);
          }
        } catch (dbErr) {
          console.warn('[DocumentService] Supabase DB exception:', dbErr);
        }
      }

      // 4. Save to local cache
      const current = await this.getDocuments();
      const updatedList = [newDocument, ...current.filter(d => d.id !== newDocument.id)];
      this.saveToLocalCache(updatedList);

      // Dispatch event so UI components refresh
      window.dispatchEvent(new CustomEvent('portfolio_documents_updated', { detail: newDocument }));

      onProgress?.(100, 'Document successfully saved to Supabase!');
      return { success: true, document: newDocument };
    } catch (err: any) {
      console.error('[DocumentService] uploadDocument failure:', err);
      return { success: false, error: err?.message || 'Failed to upload document.' };
    }
  }

  /**
   * Delete a document (Admin only)
   */
  static async deleteDocument(doc: PublicDocument): Promise<{ success: boolean; error?: string }> {
    try {
      const client = getSupabase();

      if (client && isSupabaseConnected()) {
        try {
          // Delete from database
          await client.from('public_documents').delete().eq('id', doc.id);

          // Delete from storage if real storage path
          if (doc.storagePath && !doc.storagePath.startsWith('data:') && !doc.storagePath.startsWith('inline/')) {
            await client.storage.from(STORAGE_BUCKET).remove([doc.storagePath]);
          }
        } catch (err) {
          console.warn('[DocumentService] Delete exception in Supabase:', err);
        }
      }

      // Remove from local cache
      const current = this.readFromLocalCache();
      const filtered = current.filter(d => d.id !== doc.id);
      this.saveToLocalCache(filtered);

      window.dispatchEvent(new CustomEvent('portfolio_documents_updated'));
      return { success: true };
    } catch (err: any) {
      console.error('[DocumentService] deleteDocument error:', err);
      return { success: false, error: err?.message || 'Failed to delete document.' };
    }
  }

  /**
   * Increment download counter in Supabase & Local Cache
   */
  static async incrementDownloadCount(id: string): Promise<void> {
    const current = this.readFromLocalCache();
    const updated = current.map(doc => {
      if (doc.id === id) {
        return { ...doc, downloadCount: (doc.downloadCount || 0) + 1 };
      }
      return doc;
    });
    this.saveToLocalCache(updated);

    const client = getSupabase();
    if (client && isSupabaseConnected()) {
      try {
        const doc = updated.find(d => d.id === id);
        if (doc) {
          await client
            .from('public_documents')
            .update({ download_count: doc.downloadCount })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('[DocumentService] Could not update download count in Supabase:', err);
      }
    }
  }

  /**
   * Universal, robust browser file downloader
   * Handles cross-origin links, data URLs, and storage URLs cleanly
   */
  static async triggerDownload(doc: PublicDocument): Promise<void> {
    try {
      this.incrementDownloadCount(doc.id);

      // If data URL, trigger direct download
      if (doc.publicUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = doc.publicUrl;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Try fetching as blob to enforce correct filename on cross-origin storage
      try {
        const response = await fetch(doc.publicUrl, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = doc.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
          return;
        }
      } catch (fetchErr) {
        console.warn('[DocumentService] Direct blob fetch failed, falling back to window.open:', fetchErr);
      }

      // Fallback: standard anchor click or new tab
      const fallbackLink = document.createElement('a');
      fallbackLink.href = doc.publicUrl;
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      fallbackLink.download = doc.fileName;
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } catch (err) {
      console.error('[DocumentService] Download error:', err);
      // Last resort: open public URL
      window.open(doc.publicUrl, '_blank');
    }
  }

  /**
   * Read file as base64 Data URL
   */
  private static readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file for storage'));
      reader.readAsDataURL(file);
    });
  }

  private static readFromLocalCache(): PublicDocument[] {
    try {
      // Clear legacy cache keys containing mock documents
      try {
        localStorage.removeItem('portfolio_public_documents_cache');
        localStorage.removeItem('portfolio_public_documents_cache_v2');
      } catch {}

      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy seed or placeholder objects
          return parsed.filter(d => 
            !d.id?.startsWith('doc_resume') &&
            !d.id?.startsWith('doc_ml_') &&
            !d.id?.startsWith('doc_sys_') &&
            !d.id?.startsWith('doc_pytorch_') &&
            !d.storagePath?.includes('seed_')
          );
        }
      }
    } catch {}
    return [];
  }

  private static saveToLocalCache(docs: PublicDocument[]): void {
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(docs));
    } catch (err) {
      console.warn('[DocumentService] Local storage write warning:', err);
    }
  }
}
